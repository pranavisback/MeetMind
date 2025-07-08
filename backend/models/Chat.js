const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'meeting'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    metadata: {
      fileUrl: { type: String },
      fileName: { type: String },
      fileSize: { type: Number },
      imageUrl: { type: String }
    },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    edited: {
      isEdited: { type: Boolean, default: false },
      editedAt: { type: Date },
      originalContent: { type: String }
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String },
      addedAt: { type: Date, default: Date.now }
    }],
    timestamp: { type: Date, default: Date.now }
  }],
  metadata: {
    relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    matchContext: {
      matchId: { type: String },
      matchScore: { type: Number }
    },
    mcpServerId: { type: String }, // MCP server identifier
    isArchived: { type: Boolean, default: false },
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId }]
  },
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    autoDeleteAfter: { type: Number }, // in days
    notificationsEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for last message
chatSchema.virtual('lastMessage').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Virtual for unread count per user
chatSchema.methods.getUnreadCount = function(userId) {
  const userObjectId = mongoose.Types.ObjectId(userId);
  let unreadCount = 0;
  
  for (const message of this.messages) {
    const hasRead = message.readBy.some(read => read.user.equals(userObjectId));
    if (!hasRead && !message.sender.equals(userObjectId)) {
      unreadCount++;
    }
  }
  
  return unreadCount;
};

// Index for better performance
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ type: 1, createdAt: -1 });
chatSchema.index({ 'messages.timestamp': -1 });

module.exports = mongoose.model('Chat', chatSchema);
