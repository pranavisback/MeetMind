const express = require('express');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { body, validationResult } = require('express-validator');
const { findBy } = require('../utils/dataManager');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Get current user profile (Clerk + our profile data)
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Get Clerk user data
    const clerkUser = await clerkClient.users.getUser(req.user.clerkUserId);
    
    // Combine Clerk user data with our profile
    const userResponse = {
      id: req.user.id,
      clerkUserId: req.user.clerkUserId,
      profile: {
        ...req.user.profile,
        firstName: clerkUser.firstName || req.user.profile.firstName,
        lastName: clerkUser.lastName || req.user.profile.lastName,
        email: clerkUser.primaryEmailAddress?.emailAddress || req.user.profile.email,
        avatar: clerkUser.imageUrl || req.user.profile.avatar
      },
      preferences: req.user.preferences,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };

    res.json({ user: userResponse });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Sync Clerk user with our profile system
 * POST /api/auth/sync
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    // Get fresh Clerk user data
    const clerkUser = await clerkClient.users.getUser(req.user.clerkUserId);
    
    // Update our profile with latest Clerk data
    const updatedProfile = {
      ...req.user,
      profile: {
        ...req.user.profile,
        firstName: clerkUser.firstName || req.user.profile.firstName,
        lastName: clerkUser.lastName || req.user.profile.lastName,
        email: clerkUser.primaryEmailAddress?.emailAddress || req.user.profile.email,
        avatar: clerkUser.imageUrl || req.user.profile.avatar
      },
      updatedAt: new Date().toISOString()
    };

    res.json({ 
      message: 'Profile synced successfully',
      user: updatedProfile 
    });

  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check for authentication
 * GET /api/auth/health
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Authentication',
    timestamp: new Date().toISOString(),
    clerk: !!process.env.CLERK_SECRET_KEY
  });
});

module.exports = router;
