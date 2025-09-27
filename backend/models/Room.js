const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxLength: [50, 'Room name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxLength: [200, 'Room description cannot exceed 200 characters'],
    trim: true
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxMembers: {
    type: Number,
    default: 50,
    min: 2,
    max: 100
  },
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    muteNonAdmins: {
      type: Boolean,
      default: false
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique room code
roomSchema.statics.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Ensure creator is added as admin member
roomSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add creator as admin member
    this.members.push({
      user: this.creator,
      role: 'admin'
    });
  }
  next();
});

// Update last activity
roomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Check if user is member
roomSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    // Handle both populated and non-populated cases
    const memberUserId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberUserId === userId.toString();
  });
};

// Check if user is admin
roomSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => {
    // Handle both populated and non-populated cases
    const memberUserId = member.user._id ? member.user._id.toString() : member.user.toString();
    return memberUserId === userId.toString();
  });
  return member && member.role === 'admin';
};

// Add member to room
roomSchema.methods.addMember = function(userId) {
  if (!this.isMember(userId)) {
    if (this.members.length >= this.maxMembers) {
      throw new Error('Room has reached maximum member limit');
    }
    this.members.push({
      user: userId,
      role: 'member'
    });
  }
};

// Remove member from room
roomSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
};

// Virtual for member count
roomSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for active member count (you can extend this to track online members)
roomSchema.virtual('activeMemberCount').get(function() {
  return this.members.length; // For now, same as member count
});

roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', roomSchema);