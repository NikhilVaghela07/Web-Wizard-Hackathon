import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  sendMessage(content) {
    if (this.socket) {
      this.socket.emit('sendMessage', { content });
    }
  }

  // Room events
  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('joinRoom', roomId);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('newMessage', callback);
    }
  }

  // User events
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('userJoined', callback);
    }
  }

  offUserJoined(callback) {
    if (this.socket) {
      this.socket.off('userJoined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('userLeft', callback);
    }
  }

  offUserLeft(callback) {
    if (this.socket) {
      this.socket.off('userLeft', callback);
    }
  }

  onActiveUsers(callback) {
    if (this.socket) {
      this.socket.on('activeUsers', callback);
    }
  }

  offActiveUsers(callback) {
    if (this.socket) {
      this.socket.off('activeUsers', callback);
    }
  }

  // Typing events
  sendTyping(isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { isTyping });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  offUserTyping(callback) {
    if (this.socket) {
      this.socket.off('userTyping', callback);
    }
  }

  // Error handling
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  offError(callback) {
    if (this.socket) {
      this.socket.off('error', callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;