const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SkillMatch = require('../models/SkillMatch');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const router = express.Router();

/**
 * Get current user's profile
 * GET /api/profile
 */
router.get('/', async (req, res) => {
  try {
    // Use MongoDB User model to get current user's profile
    const { clerkId } = req.user;
    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ profile: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create or update user profile
 * PUT /api/profile
 */
router.put('/', [
  body('profile.bio').optional().isLength({ max: 1000 }),
  body('profile.professionalTitle').optional().isLength({ max: 100 }),
  body('profile.company').optional().isLength({ max: 100 }),
  body('profile.location.city').optional().isLength({ max: 100 }),
  body('profile.location.country').optional().isLength({ max: 100 }),
  body('preferences.skills').optional().isArray(),
  body('preferences.interests').optional().isArray(),
  body('preferences.networkingGoals').optional().isArray(),
  body('preferences.meetingPreferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { 
      profile: profileData, 
      preferences: preferencesData,
      skills,
      interests,
      networkingGoals 
    } = req.body;
    
    const { clerkId } = req.user;
    
    // Update User model (original)
    const updateFields = {};
    if (profileData) updateFields.profile = profileData;
    if (preferencesData) updateFields.preferences = preferencesData;
    updateFields.updatedAt = new Date().toISOString();
    
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateFields },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also save to SkillMatch collection for enhanced matching
    const skillMatchData = {
      clerkId,
      userId: user._id,
      profile: profileData || {},
      skills: skills || {},
      interests: interests || {},
      networkingGoals: networkingGoals || [],
      preferences: preferencesData || {}
    };
    
    // Update or create SkillMatch profile
    const skillMatchProfile = await SkillMatch.findOneAndUpdate(
      { clerkId },
      { $set: skillMatchData },
      { new: true, upsert: true }
    );
    
    res.json({ 
      message: 'Profile updated successfully', 
      profile: user,
      skillMatchProfile: skillMatchProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Search profiles by skills or interests
 * GET /api/profile/search?q=query&type=skills|interests
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, type = 'all', limit = 20 } = req.query;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const searchTerm = query.toLowerCase().trim();
    const { clerkId } = req.user;
    // Build MongoDB query
    const mongoQuery = {
      isActive: true,
      clerkId: { $ne: clerkId },
      $or: []
    };
    if (type === 'skills') {
      mongoQuery.$or.push({ 'preferences.skills': { $elemMatch: { $regex: searchTerm, $options: 'i' } } });
    } else if (type === 'interests') {
      mongoQuery.$or.push({ 'preferences.interests': { $elemMatch: { $regex: searchTerm, $options: 'i' } } });
    } else if (type === 'networkingGoals') {
      mongoQuery.$or.push({ 'preferences.networkingGoals': { $elemMatch: { $regex: searchTerm, $options: 'i' } } });
    } else {
      mongoQuery.$or.push(
        { 'preferences.skills': { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { 'preferences.interests': { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { 'preferences.networkingGoals': { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { 'profile.bio': { $regex: searchTerm, $options: 'i' } },
        { 'profile.professionalTitle': { $regex: searchTerm, $options: 'i' } },
        { 'profile.company': { $regex: searchTerm, $options: 'i' } },
        { 'profile.location.city': { $regex: searchTerm, $options: 'i' } },
        { 'profile.location.country': { $regex: searchTerm, $options: 'i' } }
      );
    }
    // Remove $or if empty
    if (mongoQuery.$or.length === 0) delete mongoQuery.$or;
    const users = await User.find(mongoQuery).limit(parseInt(limit));
    const profiles = users.map(user => ({
      id: user._id,
      clerkId: user.clerkId,
      profile: user.profile,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.json({ profiles, total: profiles.length, limit: parseInt(limit) });
  } catch (error) {
    console.error('Search profiles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current user's skillmatch profile
 * GET /api/profile/skillmatch
 */
router.get('/skillmatch', async (req, res) => {
  try {
    const { clerkId } = req.user;
    const skillMatchProfile = await SkillMatch.findOne({ clerkId });
    
    if (!skillMatchProfile) {
      // Create a basic skillmatch profile if it doesn't exist
      const user = await User.findOne({ clerkId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const newSkillMatchProfile = await SkillMatch.create({
        clerkId,
        userId: user._id,
        profile: {
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || ''
        }
      });
      
      return res.json({ skillMatchProfile: newSkillMatchProfile });
    }
    
    res.json({ skillMatchProfile });
  } catch (error) {
    console.error('Get skillmatch profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get profile by profile ID (active profiles only)
 * GET /api/profile/:profileId
 */
router.get('/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    // Use MongoDB to find by _id and isActive
    const user = await User.findOne({ _id: profileId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ profile: user });
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Upload profile picture
 * POST /api/profile/upload-picture
 */
router.post('/upload-picture', async (req, res) => {
  try {
    // This is a simplified version - in production, you'd use multer or similar
    // for actual file uploads and store in cloud storage
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Find user's profile
    const profiles = await findBy('profiles', profile => profile.userId === req.user.id);
    
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update profile with new picture
    const updatedProfile = await updateItem('profiles', profiles[0].id, {
      profilePicture: imageData
    });

    res.json({ 
      message: 'Profile picture updated successfully',
      profilePicture: updatedProfile.profilePicture
    });

  } catch (error) {
    console.error('Upload picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    const user = await User.findOne({ username });
    res.json({ available: !user });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get or create user profile by Clerk ID
router.get('/me', async (req, res) => {
  try {
    const { clerkId } = req.user;
    let user = await User.findOne({ clerkId });

    // Always fetch Clerk user to get latest email
    const clerkUser = await clerkClient.users.getUser(clerkId);
    // Try to get email from Clerk (works for email, GitHub, Facebook, etc.)
    let email = '';
    if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
      email = clerkUser.emailAddresses[0].emailAddress;
    } else if (clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0) {
      // Try to get email from social login
      email = clerkUser.externalAccounts[0].email;
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found for Clerk user.' });
    }

    if (!user) {
      // Only save email on first login, username will be set later
      user = await User.create({ clerkId, email });
    } else {
      // Always update email if changed
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }
    }

    res.json({ profile: user });
  } catch (error) {
    console.error('Get or create profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile and username (with uniqueness check)
router.put('/me', async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { username, profile, preferences } = req.body;
    const updateFields = {};
    if (username) {
      const existing = await User.findOne({ username, clerkId: { $ne: clerkId } });
      if (existing) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
      updateFields.username = username;
    }
    if (profile) updateFields.profile = profile;
    if (preferences) updateFields.preferences = preferences;
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateFields },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ profile: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/me', async (req, res) => {
  try {
    const { clerkId } = req.user;
    const user = await User.findOneAndDelete({ clerkId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Optionally: clean up related data (meetings, chats, etc.)
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate a unique username suggestion based on name or email
 * POST /api/profile/generate-username
 */
router.post('/generate-username', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const { clerkId } = req.user;
    
    // Helper function to generate username suggestions
    const generateUsernameSuggestions = async (baseName) => {
      const suggestions = [];
      const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Basic suggestions
      suggestions.push(cleanBase);
      suggestions.push(`${cleanBase}${Math.floor(Math.random() * 1000)}`);
      suggestions.push(`${cleanBase}${new Date().getFullYear()}`);
      
      // Add more variations
      if (firstName && lastName) {
        const firstInitial = firstName.charAt(0).toLowerCase();
        const lastInitial = lastName.charAt(0).toLowerCase();
        suggestions.push(`${firstInitial}${lastName.toLowerCase()}`);
        suggestions.push(`${firstName.toLowerCase()}${lastInitial}`);
        suggestions.push(`${firstInitial}${lastInitial}${Math.floor(Math.random() * 10000)}`);
      }
      
      // Check availability and return unique ones
      const availableSuggestions = [];
      for (const suggestion of suggestions) {
        if (suggestion.length >= 3) {
          const existing = await User.findOne({ 
            username: suggestion, 
            clerkId: { $ne: clerkId } 
          });
          if (!existing) {
            availableSuggestions.push(suggestion);
          }
        }
      }
      
      return availableSuggestions;
    };
    
    let baseName = '';
    
    // Prioritize first name + last name
    if (firstName && lastName) {
      baseName = `${firstName}${lastName}`;
    } else if (firstName) {
      baseName = firstName;
    } else if (email) {
      // Extract name from email
      baseName = email.split('@')[0];
    } else {
      // Fallback to random username
      baseName = `user${Date.now()}`;
    }
    
    const suggestions = await generateUsernameSuggestions(baseName);
    
    // If no suggestions available, generate random ones
    if (suggestions.length === 0) {
      const randomSuggestions = [];
      for (let i = 0; i < 5; i++) {
        const randomUsername = `user${Math.floor(Math.random() * 1000000)}`;
        const existing = await User.findOne({ 
          username: randomUsername, 
          clerkId: { $ne: clerkId } 
        });
        if (!existing) {
          randomSuggestions.push(randomUsername);
        }
      }
      return res.json({ suggestions: randomSuggestions });
    }
    
    res.json({ suggestions: suggestions.slice(0, 5) }); // Return top 5 suggestions
  } catch (error) {
    console.error('Generate username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Set username for the current user
 * PUT /api/profile/username
 */
router.put('/username', [
  body('username').isLength({ min: 3, max: 32 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-32 characters and contain only letters, numbers, and underscores')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { username } = req.body;
    const { clerkId } = req.user;
    
    // Check if username is already taken
    const existingUser = await User.findOne({ 
      username: username.toLowerCase(), 
      clerkId: { $ne: clerkId } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already taken',
        available: false 
      });
    }
    
    // Update user's username
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: { username: username.toLowerCase() } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'Username set successfully',
      username: user.username,
      profile: user
    });
  } catch (error) {
    console.error('Set username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
