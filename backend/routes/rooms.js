const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all rooms for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user._id
    })
    .populate('creator', 'username')
    .populate('members.user', 'username')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room._id,
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        creator: room.creator,
        memberCount: room.memberCount,
        isPrivate: room.isPrivate,
        lastActivity: room.lastActivity,
        userRole: room.members.find(m => m.user._id.toString() === req.user._id.toString())?.role || 'member'
      }))
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
});

// Create a new room
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, isPrivate, maxMembers } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Room name cannot exceed 50 characters'
      });
    }

    // Generate unique room code
    let roomCode;
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      roomCode = Room.generateRoomCode();
      const existingRoom = await Room.findOne({ roomCode });
      codeExists = !!existingRoom;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique room code. Please try again.'
      });
    }

    // Create room
    const room = new Room({
      name: name.trim(),
      description: description?.trim() || '',
      roomCode,
      creator: req.user._id,
      isPrivate: !!isPrivate,
      maxMembers: maxMembers || 50
    });

    await room.save();

    // Populate creator info
    await room.populate('creator', 'username');
    await room.populate('members.user', 'username');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        creator: room.creator,
        memberCount: room.memberCount,
        isPrivate: room.isPrivate,
        lastActivity: room.lastActivity,
        userRole: 'admin'
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
});

// Join a room by room code
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode || roomCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room code is required'
      });
    }

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() })
      .populate('creator', 'username')
      .populate('members.user', 'username');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Please check the room code.'
      });
    }

    // Check if user is already a member
    if (room.isMember(req.user._id)) {
      return res.json({
        success: true,
        message: 'You are already a member of this room',
        room: {
          id: room._id,
          name: room.name,
          description: room.description,
          roomCode: room.roomCode,
          creator: room.creator,
          memberCount: room.memberCount,
          isPrivate: room.isPrivate,
          lastActivity: room.lastActivity,
          userRole: room.members.find(m => m.user._id.toString() === req.user._id.toString())?.role || 'member'
        }
      });
    }

    try {
      room.addMember(req.user._id);
      await room.save();
      await room.populate('members.user', 'username');

      // Create system message for user joining
      const systemMessage = new Message({
        user: req.user._id,
        username: req.user.username,
        room: room._id,
        content: `${req.user.username} joined the room`,
        messageType: 'system'
      });
      await systemMessage.save();

      res.json({
        success: true,
        message: 'Successfully joined the room',
        room: {
          id: room._id,
          name: room.name,
          description: room.description,
          roomCode: room.roomCode,
          creator: room.creator,
          memberCount: room.memberCount,
          isPrivate: room.isPrivate,
          lastActivity: room.lastActivity,
          userRole: 'member'
        }
      });

    } catch (error) {
      if (error.message === 'Room has reached maximum member limit') {
        return res.status(400).json({
          success: false,
          message: 'Room has reached maximum member limit'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

// Leave a room
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Don't allow creator to leave if there are other members
    if (room.creator.toString() === req.user._id.toString() && room.memberCount > 1) {
      return res.status(400).json({
        success: false,
        message: 'Room creator cannot leave. Transfer ownership or delete the room.'
      });
    }

    room.removeMember(req.user._id);

    // If room is empty, delete it
    if (room.memberCount === 0) {
      await Message.deleteMany({ room: room._id });
      await Room.findByIdAndDelete(room._id);
    } else {
      await room.save();

      // Create system message for user leaving
      const systemMessage = new Message({
        user: req.user._id,
        username: req.user.username,
        room: room._id,
        content: `${req.user.username} left the room`,
        messageType: 'system'
      });
      await systemMessage.save();
    }

    res.json({
      success: true,
      message: 'Successfully left the room'
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room'
    });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId)
      .populate('creator', 'username')
      .populate('members.user', 'username');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this room.'
      });
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        creator: room.creator,
        members: room.members.map(member => ({
          user: member.user,
          joinedAt: member.joinedAt,
          role: member.role
        })),
        memberCount: room.memberCount,
        isPrivate: room.isPrivate,
        maxMembers: room.maxMembers,
        settings: room.settings,
        lastActivity: room.lastActivity,
        userRole: room.members.find(m => m.user._id.toString() === req.user._id.toString())?.role || 'member'
      }
    });

  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details'
    });
  }
});

// Delete room (only creator can delete)
router.delete('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can delete the room'
      });
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: room._id });
    
    // Delete the room
    await Room.findByIdAndDelete(room._id);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

module.exports = router;