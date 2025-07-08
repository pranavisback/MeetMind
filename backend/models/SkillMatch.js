const mongoose = require('mongoose');

/**
 * SkillMatch model for storing user profiles in the skillmatch collection
 * This model focuses on skills, professions, and matching-related data
 */
const skillMatchSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profile: {
    firstName: { type: String, required: false, trim: true },
    lastName: { type: String, required: false, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    professionalTitle: { type: String, trim: true },
    company: { type: String, trim: true },
    department: { type: String, trim: true },
    seniority: { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'manager', 'director', 'vp', 'c-level'], trim: true },
    yearsOfExperience: { type: Number, min: 0, max: 50 },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      timezone: { type: String, trim: true }
    },
    bio: { type: String, maxlength: 1000 },
    avatar: { type: String },
    socialLinks: {
      linkedIn: { type: String },
      twitter: { type: String },
      github: { type: String },
      website: { type: String }
    }
  },
  skills: {
    technical: [{ 
      name: { type: String, required: true, trim: true },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
      yearsUsed: { type: Number, min: 0, max: 50 }
    }],
    soft: [{ 
      name: { type: String, required: true, trim: true },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
    }],
    industries: [{ type: String, trim: true }],
    certifications: [{
      name: { type: String, required: true, trim: true },
      issuer: { type: String, trim: true },
      dateObtained: { type: Date },
      expiryDate: { type: Date },
      credentialId: { type: String, trim: true }
    }]
  },
  interests: {
    professional: [{ type: String, trim: true }], // e.g., "AI/ML", "Blockchain", "Sustainability"
    personal: [{ type: String, trim: true }], // e.g., "Photography", "Travel", "Cooking"
    learning: [{ type: String, trim: true }] // e.g., "React", "Python", "Leadership"
  },
  networkingGoals: [{
    type: { type: String, enum: ['mentorship', 'collaboration', 'job_opportunity', 'knowledge_sharing', 'business_partnership', 'investment'], required: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    targetRoles: [{ type: String, trim: true }],
    targetCompanies: [{ type: String, trim: true }],
    targetIndustries: [{ type: String, trim: true }]
  }],
  preferences: {
    meetingPreferences: {
      format: { type: String, enum: ['virtual', 'in-person', 'both'], default: 'both' },
      duration: { type: String, enum: ['15min', '30min', '45min', '60min'], default: '30min' },
      timeZone: { type: String, default: 'UTC' },
      availability: {
        days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
        timeSlots: [{ 
          start: { type: String }, // e.g., "09:00"
          end: { type: String } // e.g., "17:00"
        }]
      }
    },
    communicationStyle: { type: String, enum: ['formal', 'casual', 'mixed'], default: 'mixed' },
    matchingCriteria: {
      prioritizeSkills: { type: Boolean, default: true },
      prioritizeIndustry: { type: Boolean, default: false },
      prioritizeLocation: { type: Boolean, default: false },
      prioritizeSeniority: { type: Boolean, default: false }
    }
  },
  matchingMetadata: {
    profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },
    lastProfileUpdate: { type: Date, default: Date.now },
    matchingEnabled: { type: Boolean, default: true },
    matchingScore: { type: Number, min: 0, max: 100, default: 50 }, // Base matching score
    tags: [{ type: String, trim: true }] // Auto-generated tags for matching
  },
  analytics: {
    profileViews: { type: Number, default: 0 },
    matchesGenerated: { type: Number, default: 0 },
    successfulConnections: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true } // Allow profile to be visible in matching
}, {
  timestamps: true,
  collection: 'skillmatch', // Explicitly set collection name
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
skillMatchSchema.virtual('profile.fullName').get(function() {
  return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim();
});

// Virtual for all skills combined
skillMatchSchema.virtual('allSkills').get(function() {
  const technical = this.skills?.technical?.map(s => s.name) || [];
  const soft = this.skills?.soft?.map(s => s.name) || [];
  return [...technical, ...soft];
});

// Virtual for all interests combined
skillMatchSchema.virtual('allInterests').get(function() {
  const professional = this.interests?.professional || [];
  const personal = this.interests?.personal || [];
  const learning = this.interests?.learning || [];
  return [...professional, ...personal, ...learning];
});

// Indexes for better search and matching performance
skillMatchSchema.index({ clerkId: 1 });
skillMatchSchema.index({ userId: 1 });
skillMatchSchema.index({ 'profile.professionalTitle': 'text', 'profile.company': 'text' });
skillMatchSchema.index({ 'skills.technical.name': 1 });
skillMatchSchema.index({ 'skills.soft.name': 1 });
skillMatchSchema.index({ 'skills.industries': 1 });
skillMatchSchema.index({ 'interests.professional': 1 });
skillMatchSchema.index({ 'interests.personal': 1 });
skillMatchSchema.index({ 'interests.learning': 1 });
skillMatchSchema.index({ 'networkingGoals.type': 1 });
skillMatchSchema.index({ 'profile.location.city': 1, 'profile.location.country': 1 });
skillMatchSchema.index({ 'matchingMetadata.matchingEnabled': 1, isActive: 1, isPublic: 1 });

// Pre-save middleware to calculate profile completeness
skillMatchSchema.pre('save', function(next) {
  let completeness = 0;
  const fields = [
    this.profile?.firstName, this.profile?.lastName, this.profile?.professionalTitle,
    this.profile?.company, this.profile?.bio, this.profile?.location?.city,
    this.skills?.technical?.length > 0, this.skills?.soft?.length > 0,
    this.interests?.professional?.length > 0, this.networkingGoals?.length > 0
  ];
  
  completeness = (fields.filter(Boolean).length / fields.length) * 100;
  this.matchingMetadata.profileCompleteness = Math.round(completeness);
  this.matchingMetadata.lastProfileUpdate = new Date();
  
  next();
});

module.exports = mongoose.model('SkillMatch', skillMatchSchema);
