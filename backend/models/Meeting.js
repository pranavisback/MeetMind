const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['invited', 'accepted', 'declined', 'tentative'], default: 'invited' },
    invitedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
  }],
  dateTime: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timeZone: { type: String, default: 'UTC' }
  },
  location: {
    type: { type: String, enum: ['virtual', 'in-person'], required: true },
    details: { type: String }, // Meeting link for virtual, address for in-person
    platform: { type: String } // Zoom, Teams, etc. for virtual meetings
  },
  agenda: [{
    item: { type: String, required: true },
    duration: { type: Number }, // in minutes
    presenter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  metadata: {
    matchScore: { type: Number }, // For AI-generated meetings
    suggestedBy: { type: String, enum: ['ai', 'user'], default: 'user' },
    fetchaiAgentId: { type: String }, // Fetch.ai agent identifier
    recurring: {
      isRecurring: { type: Boolean, default: false },
      pattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      endDate: { type: Date }
    }
  },
  notes: {
    preparation: { type: String },
    summary: { type: String },
    actionItems: [{ 
      task: { type: String },
      assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      dueDate: { type: Date }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for meeting duration
meetingSchema.virtual('duration').get(function() {
  if (this.dateTime.start && this.dateTime.end) {
    return Math.round((this.dateTime.end - this.dateTime.start) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Index for better query performance
meetingSchema.index({ organizer: 1, 'dateTime.start': 1 });
meetingSchema.index({ 'attendees.user': 1, 'dateTime.start': 1 });
meetingSchema.index({ status: 1, 'dateTime.start': 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
