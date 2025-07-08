const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: false, // Made optional for Clerk onboarding
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    minlength: 3,
    maxlength: 32
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false // Not required for Clerk users
  },
  profile: {
    firstName: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    professionalTitle: { type: String, trim: true }, // Professional Title as per plan
    company: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    bio: { type: String, maxlength: 1000 }, // Increased for better descriptions
    avatar: { type: String },
    linkedIn: { type: String },
    website: { type: String }
  },
  preferences: {
    skills: [{ type: String, trim: true }], // Skills & Expertise
    interests: [{ type: String, trim: true }], // Interests
    networkingGoals: [{ type: String, trim: true }], // Networking Goals as per plan
    meetingPreferences: {
      format: { type: String, enum: ['virtual', 'in-person', 'both'], default: 'both' },
      duration: { type: String, enum: ['15min', '30min', '45min', '60min'], default: '30min' },
      timeZone: { type: String, default: 'UTC' }
    }
  },
  matches: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 0, max: 100 },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  meetings: [{
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    role: { type: String, enum: ['organizer', 'attendee'] }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim();
});

// Index for better search performance
userSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text', 'profile.company': 'text' });
userSchema.index({ 'preferences.skills': 1 });
userSchema.index({ 'preferences.interests': 1 });

// Log all incoming requests for debugging
userSchema.pre('save', function(next) {
  console.log('Saving user:', this);
  next();
});

module.exports = mongoose.model('User', userSchema);
