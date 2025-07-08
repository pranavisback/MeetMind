const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService'); // Use main groq service
const User = require('../models/User');

/**
 * Enhanced matching routes with AI-powered recommendations using Groq API
 */

// Get AI-powered matches for current user
router.get('/enhanced', async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { limit = 10, minScore = 60 } = req.query;

    // Get current user
    const currentUser = await User.findOne({ clerkId }).lean();
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all other active users
    const allUsers = await User.find({ 
      clerkId: { $ne: clerkId },
      isActive: true 
    }).lean();

    if (allUsers.length === 0) {
      return res.json({
        success: true,
        matches: [],
        totalCount: 0,
        message: 'No other users found for matching'
      });
    }

    // Calculate AI-powered match scores
    const matchPromises = allUsers.map(async (user) => {
      try {
        const matchResult = await groqService.calculateMatchScore(currentUser, user);
        return {
          userId: user._id.toString(),
          clerkId: user.clerkId,
          profile: user.profile,
          preferences: user.preferences,
          compatibility: matchResult,
          matchScore: matchResult.score
        };
      } catch (error) {
        console.error(`Error calculating match for user ${user._id}:`, error);
        return null;
      }
    });

    const matches = await Promise.all(matchPromises);
    
    // Filter out null results and sort by score
    const validMatches = matches
      .filter(match => match !== null && match.matchScore >= parseInt(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      matches: validMatches,
      totalCount: validMatches.length,
      filters: { limit: parseInt(limit), minScore: parseInt(minScore) }
    });

  } catch (error) {
    console.error('Enhanced matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced matches'
    });
  }
});

// Get detailed match analysis between current user and a specific user
router.get('/details/:targetUserId', async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { targetUserId } = req.params;

    // Get current user
    const currentUser = await User.findOne({ clerkId }).lean();
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Get detailed AI analysis
    const matchResult = await groqService.calculateMatchScore(currentUser, targetUser);
    
    // Generate meeting suggestions
    const meetingSuggestions = await groqService.generateMeetingSuggestions([currentUser, targetUser]);

    res.json({
      success: true,
      matchDetails: {
        targetUser: {
          userId: targetUser._id.toString(),
          clerkId: targetUser.clerkId,
          profile: targetUser.profile,
          preferences: targetUser.preferences
        },
        compatibility: matchResult,
        meetingSuggestions: meetingSuggestions,
        aiInsights: {
          strengthAreas: matchResult.complementarySkills || [],
          collaborationPotential: matchResult.collaborationPotential,
          networkingValue: matchResult.networkingValue
        }
      }
    });

  } catch (error) {
    console.error('Match details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get match details'
    });
  }
});

// Analyze user's profile for suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { clerkId } = req.user;
    
    // Get current user
    const currentUser = await User.findOne({ clerkId }).lean();
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock conversation for analysis
    const mockMessages = [
      { sender: { profile: currentUser.profile }, content: "Hi, I'm interested in networking" }
    ];

    const analysis = await groqService.analyzeConversation(mockMessages, currentUser);

    res.json({
      success: true,
      analysis: analysis,
      profileStrengths: currentUser.preferences.skills || [],
      improvementSuggestions: analysis.suggestions || []
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze profile'
    });
  }
});

// Save user feedback on matches for ML improvement
router.post('/feedback', async (req, res) => {
  try {
    const { userId, targetUserId, action, rating, feedback } = req.body;

    // Store feedback for ML improvement
    console.log('Match feedback:', {
      userId,
      targetUserId,
      action,
      rating,
      feedback,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record feedback'
    });
  }
});

module.exports = router;
