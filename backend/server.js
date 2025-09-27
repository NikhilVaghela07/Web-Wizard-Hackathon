const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');
const { authenticateSocket } = require('./middleware/socketAuth');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
};

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Trust proxy for rate limiting (development environment)
if (process.env.NODE_ENV !== 'production') {
  app.set('trust proxy', 1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chat server is running!' });
});

// Store active users and their rooms
const activeUsers = new Map();
const roomUsers = new Map(); // roomId -> Set of user IDs

// Socket.io connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.username);

  // Add user to active users
  activeUsers.set(socket.id, {
    id: socket.user.id,
    username: socket.user.username,
    joinedAt: new Date(),
    currentRoom: null
  });

  // Handle joining a room
  socket.on('joinRoom', async (roomId) => {
    try {
      const Room = require('./models/Room');
      
      if (!roomId) {
        // Join global chat
        socket.join('global-chat');
        activeUsers.get(socket.id).currentRoom = null;
        
        // Send current active users in global chat
        const globalUsers = Array.from(activeUsers.values()).filter(user => user.currentRoom === null);
        socket.emit('activeUsers', globalUsers);
        socket.to('global-chat').emit('activeUsers', globalUsers);
        return;
      }

      const room = await Room.findById(roomId);
      if (!room || !room.isMember(socket.user.id)) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      // Leave previous room if any
      const currentRoom = activeUsers.get(socket.id).currentRoom;
      if (currentRoom) {
        socket.leave(currentRoom === 'global' ? 'global-chat' : `room-${currentRoom}`);
        
        if (currentRoom !== 'global') {
          // Remove from room users
          if (roomUsers.has(currentRoom)) {
            roomUsers.get(currentRoom).delete(socket.user.id);
            // Broadcast updated user list to room
            const roomActiveUsers = Array.from(roomUsers.get(currentRoom) || [])
              .map(userId => Array.from(activeUsers.values()).find(user => user.id === userId))
              .filter(Boolean);
            io.to(`room-${currentRoom}`).emit('activeUsers', roomActiveUsers);
          }
        }
      }

      // Join new room
      socket.join(`room-${roomId}`);
      activeUsers.get(socket.id).currentRoom = roomId;

      // Add to room users
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.user.id);

      // Send current active users in this room
      const roomActiveUsers = Array.from(roomUsers.get(roomId))
        .map(userId => Array.from(activeUsers.values()).find(user => user.id === userId))
        .filter(Boolean);
      
      socket.emit('activeUsers', roomActiveUsers);
      socket.to(`room-${roomId}`).emit('activeUsers', roomActiveUsers);

      // Notify room that user joined
      socket.to(`room-${roomId}`).emit('userJoined', {
        username: socket.user.username,
        message: `${socket.user.username} joined the room`,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle new messages
  socket.on('sendMessage', async (data) => {
    try {
      const Message = require('./models/Message');
      const currentRoom = activeUsers.get(socket.id).currentRoom;
      
      // Validate room access if it's a room message
      if (currentRoom) {
        const Room = require('./models/Room');
        const room = await Room.findById(currentRoom);
        if (!room || !room.isMember(socket.user.id)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }
      }
      
      // Save message to database
      const message = new Message({
        user: socket.user.id,
        username: socket.user.username,
        room: currentRoom,
        content: data.content,
        timestamp: new Date()
      });

      await message.save();

      // Broadcast message to appropriate room or global
      const broadcastTarget = currentRoom ? `room-${currentRoom}` : 'global-chat';
      const messageData = {
        id: message._id,
        username: socket.user.username,
        content: data.content,
        timestamp: message.timestamp
      };

      io.to(broadcastTarget).emit('newMessage', messageData);

      // Update room activity if it's a room message
      if (currentRoom) {
        const Room = require('./models/Room');
        const room = await Room.findById(currentRoom);
        if (room) {
          await room.updateActivity();
        }
      }

    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user typing
  socket.on('typing', (data) => {
    const currentRoom = activeUsers.get(socket.id).currentRoom;
    const broadcastTarget = currentRoom ? `room-${currentRoom}` : 'global-chat';
    
    socket.to(broadcastTarget).emit('userTyping', {
      username: socket.user.username,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.username);
    
    const user = activeUsers.get(socket.id);
    if (user) {
      const currentRoom = user.currentRoom;
      
      // Remove from room users if in a room
      if (currentRoom && roomUsers.has(currentRoom)) {
        roomUsers.get(currentRoom).delete(socket.user.id);
        
        // Broadcast updated user list to room
        const roomActiveUsers = Array.from(roomUsers.get(currentRoom))
          .map(userId => Array.from(activeUsers.values()).find(user => user.id === userId))
          .filter(Boolean);
        io.to(`room-${currentRoom}`).emit('activeUsers', roomActiveUsers);
        
        // Notify room that user left
        socket.to(`room-${currentRoom}`).emit('userLeft', {
          username: socket.user.username,
          message: `${socket.user.username} left the room`,
          timestamp: new Date()
        });
      } else {
        // Handle global chat disconnect
        const globalUsers = Array.from(activeUsers.values()).filter(user => user.currentRoom === null && user.id !== socket.user.id);
        socket.to('global-chat').emit('activeUsers', globalUsers);
        
        socket.to('global-chat').emit('userLeft', {
          username: socket.user.username,
          message: `${socket.user.username} left the chat`,
          timestamp: new Date()
        });
      }
    }
    
    // Remove user from active users
    activeUsers.delete(socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});