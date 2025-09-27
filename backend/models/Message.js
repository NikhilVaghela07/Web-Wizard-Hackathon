const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null // null for global chat, ObjectId for room-specific messages
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for better performance
messageSchema.index({ createdAt: -1 });
messageSchema.index({ user: 1 });
messageSchema.index({ room: 1, createdAt: -1 });

// Static method to get recent messages
messageSchema.statics.getRecentMessages = function(roomId = null, limit = 50) {
  const query = roomId ? { room: roomId } : { room: null };
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username profilePicture')
    .lean();
};

// Static method to get messages by date range
messageSchema.statics.getMessagesByDateRange = function(startDate, endDate, roomId = null, limit = 100) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (roomId !== null) {
    query.room = roomId;
  } else {
    query.room = null;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username profilePicture')
    .lean();
};

module.exports = mongoose.model('Message', messageSchema);