const express = require('express');
const router = express.Router();
const enhancedFetchAiService = require('../services/enhancedFetchAiService');
const User = require('../models/User');

/**
 * Enhanced meeting routes with Fetch.ai autonomous scheduling
 */

// Initialize AI-powered meeting scheduling
router.post('/ai-schedule', async (req, res) => {
  try {
    const { participants, context } = req.body;

    if (!participants || participants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 participants required'
      });
    }

    // Create autonomous scheduling agent
    const agentResult = await enhancedFetchAiService.createSchedulingAgent({
      participants: participants,
      duration: context?.suggestedDuration || 60,
      preferences: {
        timeOfDay: 'any',
        urgency: 'normal',
        type: 'networking'
      }
    });

    res.json({
      success: true,
      agentId: agentResult.agentId,
      status: agentResult.status,
      capabilities: agentResult.capabilities
    });

  } catch (error) {
    console.error('AI scheduling initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize AI scheduling'
    });
  }
});

// Get optimal time slots from AI agent
router.get('/time-slots/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { preferences } = req.query;

    // Analyze availability
    const participants = [
      { userId: 'user1', email: 'user1@example.com', timezone: 'UTC' },
      { userId: 'user2', email: 'user2@example.com', timezone: 'UTC' }
    ];

    const availabilityData = await enhancedFetchAiService.analyzeAvailability(
      agentId, 
      participants
    );

    // Generate optimal time slots
    const timeSlots = await enhancedFetchAiService.generateOptimalTimeSlots(
      agentId,
      availabilityData,
      preferences ? JSON.parse(preferences) : {}
    );

    res.json({
      success: true,
      timeSlots: timeSlots,
      availabilityData: availabilityData
    });

  } catch (error) {
    console.error('Time slots generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate time slots'
    });
  }
});

// Confirm meeting booking
router.post('/confirm', async (req, res) => {
  try {
    const { agentId, timeSlot, participants, meetingDetails } = req.body;

    if (!agentId || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID and time slot are required'
      });
    }

    // Book the meeting
    const booking = await enhancedFetchAiService.bookMeeting(agentId, timeSlot, {
      title: meetingDetails?.title || 'Networking Meeting',
      description: meetingDetails?.description || 'AI-scheduled networking session',
      location: meetingDetails?.location || 'Virtual',
      participants: participants || [],
      agenda: meetingDetails?.agenda || []
    });

    // Setup intelligent reminders
    const reminders = await enhancedFetchAiService.setupIntelligentReminders(
      agentId,
      booking.meetingId,
      participants
    );

    res.json({
      success: true,
      meetingId: booking.meetingId,
      confirmationCode: booking.confirmationCode,
      status: booking.status,
      calendarEvents: booking.calendarEvents,
      reminders: reminders
    });

  } catch (error) {
    console.error('Meeting confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm meeting'
    });
  }
});

// Handle post-meeting automation
router.post('/post-meeting/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { agentId, outcome } = req.body;

    const automationResult = await enhancedFetchAiService.handlePostMeetingAutomation(
      agentId,
      meetingId,
      outcome
    );

    res.json({
      success: true,
      automationResult: automationResult
    });

  } catch (error) {
    console.error('Post-meeting automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute post-meeting automation'
    });
  }
});

// Get meeting analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock analytics data - in real implementation, this would come from database
    const analytics = {
      totalMeetings: 15,
      successfulConnections: 12,
      averageRating: 4.7,
      meetingTypes: {
        'Coffee Chat': 8,
        'Project Discussion': 4,
        'Mentoring Session': 3
      },
      monthlyTrends: [
        { month: 'Jan', meetings: 3 },
        { month: 'Feb', meetings: 5 },
        { month: 'Mar', meetings: 7 }
      ],
      topPartners: [
        { name: 'John Doe', meetings: 3, rating: 5.0 },
        { name: 'Jane Smith', meetings: 2, rating: 4.8 }
      ]
    };

    res.json({
      success: true,
      analytics: analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get meeting analytics'
    });
  }
});

module.exports = router;
