const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

/**
 * Get user's chat rooms
 * GET /api/chat/rooms
 */
router.get('/rooms', async (req, res) => {
  try {
    // Find chats where user is a participant
    const chats = await Chat.find({
      'participants.user': req.user._id,
      'participants.isActive': true
    }).sort({ updatedAt: -1 });

    // Populate participants and last message for each chat
    const chatsWithParticipants = await Promise.all(
      chats.map(async (chat) => {
        // Get other participants info
        const otherParticipants = chat.participants.filter(p => !p.user.equals(req.user._id));
        const participants = await Promise.all(
          otherParticipants.map(async (p) => {
            const user = await User.findById(p.user);
            return user ? {
              id: user._id,
              firstName: user.profile?.firstName || '',
              lastName: user.profile?.lastName || '',
              profilePicture: user.profile?.profilePicture || null
            } : null;
          })
        );
        // Get last message
        const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        // Count unread messages
        let unreadCount = 0;
        for (const message of chat.messages) {
          const hasRead = message.readBy.some(read => read.user.equals(req.user._id));
          if (!hasRead && !message.sender.equals(req.user._id)) {
            unreadCount++;
          }
        }
        return {
          id: chat._id,
          type: chat.type,
          name: chat.name,
          participants: participants.filter(p => p !== null),
          lastMessage,
          unreadCount,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        };
      })
    );
    res.json({ chats: chatsWithParticipants });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get messages for a specific chat
 * GET /api/chat/:chatId/messages
 */
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    // Verify user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some(p => p.user.equals(req.user._id))) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }
    // Get messages (from embedded messages in Chat model)
    const messages = chat.messages
      .slice(-limit - offset, chat.messages.length - offset)
      .map(m => {
        const messageObj = m.toObject();
        return {
          ...messageObj,
          id: messageObj._id,
          senderId: messageObj.sender.toString(), // Convert ObjectId to string to match frontend
          timestamp: messageObj.timestamp,
        };
      });
    res.json({
      messages,
      total: chat.messages.length,
      hasMore: offset + limit < chat.messages.length
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send a message
 * POST /api/chat/:chatId/messages
 */
router.post('/:chatId/messages', [
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'meeting_request'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { chatId } = req.params;
    const { content, type = 'text', metadata = {} } = req.body;
    
    // Verify user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some(p => p.user.equals(req.user._id))) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }
    
    // Create message in separate Message collection
    const message = await Message.create({
      chatId,
      senderId: req.user._id.toString(), // Convert ObjectId to string
      content,
      readBy: [req.user._id.toString()], // Array of string user IDs
    });

    // Also add message to the chat's embedded messages array
    const embeddedMessage = {
      sender: req.user._id,
      content,
      type,
      metadata,
      readBy: [{ user: req.user._id }],
      timestamp: message.createdAt
    };

    await Chat.findByIdAndUpdate(chatId, {
      $push: { messages: embeddedMessage },
      lastActivity: new Date()
    });
    
    // Add sender info for the response and socket emission
    const messageWithSender = {
      id: message._id,
      senderId: message.senderId, // Use the string senderId from Message model
      content: message.content,
      type: message.type || 'text',
      timestamp: message.createdAt,
      sender: {
        id: req.user._id,
        firstName: req.user.profile?.firstName || req.user.firstName || 'Unknown',
        lastName: req.user.profile?.lastName || req.user.lastName || 'User'
      }
    };
    
    // Emit message to all participants via socket for real-time updates
    req.io.to(`chat_${chatId}`).emit('new_message', messageWithSender);
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      data: messageWithSender
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Mark messages as read
 * PUT /api/chat/:chatId/read
 */
router.put('/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    
    // Verify user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some(p => p.user.equals(req.user._id))) {
      return res.status(403).json({ error: 'Access denied to this chat' });
    }
    
    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        const message = await Message.findById(messageId);
        if (message && message.chatId.equals(chatId)) {
          const readBy = message.readBy || [];
          if (!readBy.some(r => r.user.equals(req.user._id))) {
            readBy.push({ user: req.user._id });
            await Message.findByIdAndUpdate(messageId, { readBy });
          }
        }
      }
    } else {
      // Mark all unread messages in chat as read
      const unreadMessages = await Message.find({
        chatId,
        'readBy.user': { $ne: req.user._id }
      });
      
      for (const message of unreadMessages) {
        const readBy = message.readBy || [];
        readBy.push({ user: req.user._id });
        await Message.findByIdAndUpdate(message.id, { readBy });
      }
    }
    
    res.json({ message: 'Messages marked as read' });
    
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Edit a message
 * PUT /api/chat/messages/:messageId
 */
router.put('/messages/:messageId', [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { messageId } = req.params;
    const { content } = req.body;
    
    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Verify user is the sender
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ error: 'Can only edit your own messages' });
    }
    
    // Check if message is too old to edit (24 hours)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }
    
    // Update message
    const updatedMessage = await Message.findByIdAndUpdate(messageId, {
      content,
      isEdited: true,
      editedAt: new Date().toISOString()
    }, { new: true });
    
    // Emit update to chat participants
    req.io.to(`chat_${message.chatId}`).emit('message_edited', {
      messageId,
      content,
      editedAt: updatedMessage.editedAt
    });
    
    res.json({ 
      message: 'Message updated successfully',
      data: updatedMessage
    });
    
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a message
 * DELETE /api/chat/messages/:messageId
 */
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Verify user is the sender
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }
    
    // Soft delete by updating content
    const updatedMessage = await Message.findByIdAndUpdate(messageId, {
      content: '[Message deleted]',
      type: 'deleted',
      deletedAt: new Date().toISOString()
    });
    
    // Emit update to chat participants
    req.io.to(`chat_${message.chatId}`).emit('message_deleted', {
      messageId,
      deletedAt: updatedMessage.deletedAt
    });
    
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new chat room
 * POST /api/chat/rooms
 */
router.post('/rooms', [
  body('participantIds').isArray().isLength({ min: 1 }),
  body('type').optional().isIn(['direct', 'group']),
  body('name').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { participantIds, type = 'direct', name } = req.body;
    
    // Add current user to participants
    const allParticipants = [...new Set([req.user._id, ...participantIds])];
    
    // For direct chats, check if one already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingChats = await Chat.find({ 
        type: 'direct',
        'participants.user': { $all: allParticipants },
        'participants': { $size: 2 }
      });
      
      if (existingChats.length > 0) {
        const existingChat = existingChats[0];
        return res.status(200).json({ 
          message: 'Direct chat already exists',
          id: existingChat._id,
          chat: existingChat
        });
      }
    }
    
    // Create chat room
    const chat = await Chat.create({
      participants: allParticipants.map(user => ({ user })),
      type,
      name: type === 'group' ? name : null,
      isActive: true,
      lastActivity: new Date().toISOString()
    });
    
    res.status(201).json({ 
      message: 'Chat room created successfully',
      id: chat._id,
      chat
    });
    
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
