const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get chat history (room-specific or global)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const roomId = req.query.roomId || null; // null for global chat

    // If roomId is provided, verify user is a member
    if (roomId) {
      const Room = require('../models/Room');
      const room = await Room.findById(roomId);
      if (!room || !room.isMember(req.user._id)) {
        return res.status(403).json({ message: 'Access denied to this room' });
      }
    }

    const query = roomId ? { room: roomId } : { room: null };
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .lean();

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    res.json({
      messages: chronologicalMessages,
      total: await Message.countDocuments(query)
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// @route   GET /api/messages/recent
// @desc    Get recent messages (last 50) for room or global
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const roomId = req.query.roomId || null; // null for global chat

    // If roomId is provided, verify user is a member
    if (roomId) {
      const Room = require('../models/Room');
      const room = await Room.findById(roomId);
      if (!room || !room.isMember(req.user._id)) {
        return res.status(403).json({ message: 'Access denied to this room' });
      }
    }

    const messages = await Message.getRecentMessages(roomId, 50);
    
    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();
    
    res.json({ messages: chronologicalMessages });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ message: 'Server error while fetching recent messages' });
  }
});

// @route   POST /api/messages
// @desc    Send a message (alternative to socket)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new Message({
      user: req.user._id,
      username: req.user.username,
      content: content.trim()
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('user', 'username profilePicture')
      .lean();

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const messageId = req.params.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message
    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Check if message is not too old (e.g., 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      return res.status(400).json({ message: 'Message is too old to edit' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('user', 'username profilePicture')
      .lean();

    res.json({
      message: 'Message updated successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error while editing message' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message
    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

// @route   GET /api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const messages = await Message.find({
      content: { $regex: query.trim(), $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('user', 'username profilePicture')
    .lean();

    res.json({ messages });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error while searching messages' });
  }
});

module.exports = router;