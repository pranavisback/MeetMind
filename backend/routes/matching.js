const express = require('express');
const { body, validationResult } = require('express-validator');
const { findBy } = require('../utils/dataManager');
const { findMatches } = require('../utils/matchingAlgorithm');

const router = express.Router();

/**
 * Get matches for current user
 * GET /api/matching
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Find potential matches using the matching algorithm
    const matches = await findMatches(req.user, parseInt(limit));
    
    res.json({ 
      matches,
      total: matches.length,
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get match recommendations with AI analysis
 * POST /api/matching/analyze
 */
router.post('/analyze', [
  body('skills').optional().isArray(),
  body('interests').optional().isArray(),
  body('goals').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { skills = [], interests = [], goals = [] } = req.body;

    // Create a temporary profile for analysis
    const analysisProfile = {
      ...req.user,
      preferences: {
        ...req.user.preferences,
        skills: skills.length > 0 ? skills : req.user.preferences.skills,
        interests: interests.length > 0 ? interests : req.user.preferences.interests,
        goals: goals.length > 0 ? goals : req.user.preferences.goals
      }
    };

    // Find matches using the enhanced profile
    const matches = await findMatches(analysisProfile, 20);
    
    res.json({ 
      matches,
      analysisProfile: {
        skills: analysisProfile.preferences.skills,
        interests: analysisProfile.preferences.interests,
        goals: analysisProfile.preferences.goals
      },
      total: matches.length
    });

  } catch (error) {
    console.error('Analyze matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Save a match interaction (like/pass)
 * POST /api/matching/interact
 */
router.post('/interact', [
  body('targetProfileId').isString().notEmpty(),
  body('action').isIn(['like', 'pass', 'super_like'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { targetProfileId, action } = req.body;

    // TODO: Implement interaction tracking in database
    // For now, just return success
    res.json({ 
      message: 'Interaction saved',
      interaction: {
        userId: req.user.id,
        targetProfileId,
        action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Save interaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
