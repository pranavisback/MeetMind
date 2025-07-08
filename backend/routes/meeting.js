const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const fetchaiService = require('../services/fetchaiService');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { addItem, findBy, updateItem, findById } = require('../utils/dataManager');

const router = express.Router();

/**
 * Get user's meetings with AI optimization
 * GET /api/meeting/meetings
 */
router.get('/meetings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', upcoming = false } = req.query;
    
    let meetings;

    // Try MongoDB first, fallback to file system
    try {
      let query = {
        $or: [
          { organizer: userId },
          { 'attendees.user': userId }
        ]
      };

      if (status !== 'all') {
        query.status = status;
      }

      if (upcoming === 'true') {
        query['dateTime.start'] = { $gt: new Date() };
      }

      meetings = await Meeting.find(query)
        .populate('organizer', 'profile')
        .populate('attendees.user', 'profile')
        .sort({ 'dateTime.start': 1 });

    } catch (mongoError) {
      console.warn('MongoDB fallback to file system:', mongoError.message);
      
      // Fallback to file system
      let meetings = await findBy('meetings', meeting => 
        meeting.participants.some(p => p.userId === userId)
      );
      
      // Filter by status
      if (status !== 'all') {
        meetings = meetings.filter(meeting => meeting.status === status);
      }
      
      // Filter upcoming meetings
      if (upcoming === 'true') {
        const now = new Date();
        meetings = meetings.filter(meeting => new Date(meeting.scheduledTime) > now);
      }
    }
    
    // Get participant info for each meeting
    const meetingsWithParticipants = await Promise.all(
      meetings.map(async (meeting) => {
        const participantData = await Promise.all(
          meeting.participants.map(async (participant) => {
            const users = await findBy('users', user => user.id === participant.userId);
            return {
              ...participant,
              user: users[0] ? {
                id: users[0].id,
                firstName: users[0].firstName,
                lastName: users[0].lastName
              } : null
            };
          })
        );
        
        return {
          ...meeting,
          participants: participantData.filter(p => p.user !== null)
        };
      })
    );
    
    // Sort by scheduled time
    meetingsWithParticipants.sort((a, b) => 
      new Date(a.scheduledTime) - new Date(b.scheduledTime)
    );
    
    res.json({ meetings: meetingsWithParticipants });
    
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new meeting
 * POST /api/meeting/meetings
 */
router.post('/meetings', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('scheduledTime').isISO8601(),
  body('duration').isInt({ min: 15, max: 480 }), // 15 minutes to 8 hours
  body('participantIds').isArray().isLength({ min: 1 }),
  body('type').optional().isIn(['video', 'audio', 'in-person']),
  body('location').optional().isLength({ max: 200 })
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
      title,
      description = '',
      scheduledTime,
      duration,
      participantIds,
      type = 'video',
      location = ''
    } = req.body;
    
    // Validate scheduled time is in the future
    if (new Date(scheduledTime) <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    
    // Create participants array with organizer
    const participants = [
      {
        userId: req.user.id,
        role: 'organizer',
        status: 'accepted'
      },
      ...participantIds.map(userId => ({
        userId,
        role: 'participant',
        status: 'pending'
      }))
    ];
    
    // Create meeting
    const meeting = await addItem('meetings', {
      title,
      description,
      scheduledTime,
      duration,
      type,
      location,
      participants,
      status: 'scheduled',
      meetingUrl: type === 'video' ? generateMeetingUrl() : null,
      agenda: [],
      notes: '',
      recordings: []
    });
    
    // Notify participants via socket
    participantIds.forEach(userId => {
      req.io.to(`user_${userId}`).emit('meeting_invitation', {
        meetingId: meeting.id,
        organizer: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        title,
        scheduledTime
      });
    });
    
    res.status(201).json({ 
      message: 'Meeting created successfully',
      meeting
    });
    
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Respond to meeting invitation
 * PUT /api/meeting/meetings/:meetingId/respond
 */
router.put('/meetings/:meetingId/respond', [
  body('response').isIn(['accept', 'decline', 'tentative'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { meetingId } = req.params;
    const { response } = req.body;
    
    // Find meeting
    const meeting = await findById('meetings', meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Find participant
    const participantIndex = meeting.participants.findIndex(
      p => p.userId === req.user.id
    );
    
    if (participantIndex === -1) {
      return res.status(403).json({ error: 'Not invited to this meeting' });
    }
    
    // Update participant status
    meeting.participants[participantIndex].status = response === 'accept' ? 'accepted' : 
      response === 'decline' ? 'declined' : 'tentative';
    meeting.participants[participantIndex].respondedAt = new Date().toISOString();
    
    // Update meeting
    const updatedMeeting = await updateItem('meetings', meetingId, {
      participants: meeting.participants
    });
    
    // Notify organizer
    const organizer = meeting.participants.find(p => p.role === 'organizer');
    if (organizer && organizer.userId !== req.user.id) {
      req.io.to(`user_${organizer.userId}`).emit('meeting_response', {
        meetingId,
        participant: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        response
      });
    }
    
    res.json({ 
      message: `Meeting invitation ${response}ed successfully`,
      meeting: updatedMeeting
    });
    
  } catch (error) {
    console.error('Respond to meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update meeting details
 * PUT /api/meeting/meetings/:meetingId
 */
router.put('/meetings/:meetingId', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('scheduledTime').optional().isISO8601(),
  body('duration').optional().isInt({ min: 15, max: 480 }),
  body('location').optional().isLength({ max: 200 }),
  body('agenda').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    
    const { meetingId } = req.params;
    
    // Find meeting
    const meeting = await findById('meetings', meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Check if user is organizer
    const isOrganizer = meeting.participants.some(
      p => p.userId === req.user.id && p.role === 'organizer'
    );
    
    if (!isOrganizer) {
      return res.status(403).json({ error: 'Only organizer can update meeting' });
    }
    
    // Validate scheduled time if provided
    if (req.body.scheduledTime && new Date(req.body.scheduledTime) <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    
    // Update meeting
    const updateData = {};
    const allowedFields = ['title', 'description', 'scheduledTime', 'duration', 'location', 'agenda'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const updatedMeeting = await updateItem('meetings', meetingId, updateData);
    
    // Notify participants if major changes
    if (req.body.scheduledTime || req.body.title) {
      meeting.participants.forEach(participant => {
        if (participant.userId !== req.user.id) {
          req.io.to(`user_${participant.userId}`).emit('meeting_updated', {
            meetingId,
            changes: updateData,
            organizer: {
              id: req.user.id,
              firstName: req.user.firstName,
              lastName: req.user.lastName
            }
          });
        }
      });
    }
    
    res.json({ 
      message: 'Meeting updated successfully',
      meeting: updatedMeeting
    });
    
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Cancel meeting
 * DELETE /api/meeting/meetings/:meetingId
 */
router.delete('/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Find meeting
    const meeting = await findById('meetings', meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Check if user is organizer
    const isOrganizer = meeting.participants.some(
      p => p.userId === req.user.id && p.role === 'organizer'
    );
    
    if (!isOrganizer) {
      return res.status(403).json({ error: 'Only organizer can cancel meeting' });
    }
    
    // Update meeting status to cancelled
    const updatedMeeting = await updateItem('meetings', meetingId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: req.user.id
    });
    
    // Notify all participants
    meeting.participants.forEach(participant => {
      if (participant.userId !== req.user.id) {
        req.io.to(`user_${participant.userId}`).emit('meeting_cancelled', {
          meetingId,
          title: meeting.title,
          organizer: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName
          }
        });
      }
    });
    
    res.json({ 
      message: 'Meeting cancelled successfully',
      meeting: updatedMeeting
    });
    
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get available time slots for scheduling
 * GET /api/meeting/availability
 */
router.get('/availability', async (req, res) => {
  try {
    const { participantIds, duration = 60, startDate, endDate } = req.query;
    
    if (!participantIds || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'participantIds, startDate, and endDate are required' 
      });
    }
    
    const participants = participantIds.split(',');
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all participants' meetings in the date range
    const allMeetings = await findBy('meetings', meeting => 
      meeting.status === 'scheduled' &&
      meeting.participants.some(p => participants.includes(p.userId)) &&
      new Date(meeting.scheduledTime) >= start &&
      new Date(meeting.scheduledTime) <= end
    );
    
    // Get availability preferences for each participant
    const availabilityData = await Promise.all(
      participants.map(async (userId) => {
        const profiles = await findBy('profiles', profile => profile.userId === userId);
        return {
          userId,
          availability: profiles[0]?.availability || {
            timezone: 'UTC',
            preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            preferredTimes: ['09:00', '17:00']
          }
        };
      })
    );
    
    // Generate available time slots (simplified algorithm)
    const availableSlots = generateAvailableSlots(
      start,
      end,
      parseInt(duration),
      allMeetings,
      availabilityData
    );
    
    res.json({ 
      availableSlots,
      duration: parseInt(duration),
      participants: participants.length
    });
    
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create AI-optimized meeting with Fetch.ai agent
 * POST /api/meeting/schedule-ai
 */
router.post('/schedule-ai', [
  authMiddleware,
  body('title').notEmpty().withMessage('Meeting title is required'),
  body('attendeeIds').isArray().withMessage('Attendee IDs must be an array'),
  body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15-240 minutes'),
  body('timePreference').optional().isIn(['morning', 'afternoon', 'evening']),
  body('dateRange').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { 
      title, 
      description = '', 
      attendeeIds, 
      duration = 30,
      timePreference = 'afternoon',
      dateRange,
      location = { type: 'virtual' }
    } = req.body;

    // Get attendee information
    let attendees;
    try {
      attendees = await User.find({ 
        _id: { $in: [userId, ...attendeeIds] } 
      }).select('profile preferences');

      if (attendees.length !== attendeeIds.length + 1) {
        return res.status(400).json({ error: 'Some attendees not found' });
      }
    } catch (mongoError) {
      return res.status(501).json({ error: 'AI scheduling requires database connection' });
    }

    // Create Fetch.ai scheduling agent
    const meetingData = {
      title,
      participants: attendees.map(user => ({
        id: user._id.toString(),
        name: user.profile.fullName,
        timeZone: user.preferences?.meetingPreferences?.timeZone || 'UTC',
        availability: generateAvailability(user, dateRange, timePreference)
      })),
      duration,
      timeZone: 'UTC',
      constraints: {
        earliestTime: getEarliestTime(timePreference),
        latestTime: getLatestTime(timePreference),
        excludeWeekends: true,
        ...dateRange
      }
    };

    // Create scheduling agent
    const agentResult = await fetchaiService.createMeetingAgent(meetingData);

    // Get optimal meeting times
    const participantAvailability = attendees.map(user => ({
      userId: user._id.toString(),
      timeZone: user.preferences?.meetingPreferences?.timeZone || 'UTC',
      availability: generateAvailability(user, dateRange, timePreference)
    }));

    const optimization = await fetchaiService.getOptimalMeetingTimes(
      agentResult.agentId, 
      participantAvailability
    );

    // Create meeting with best suggestion
    const bestSuggestion = optimization.suggestions[0];
    if (!bestSuggestion) {
      return res.status(400).json({ error: 'No suitable meeting time found' });
    }

    const newMeeting = new Meeting({
      title,
      description,
      organizer: userId,
      attendees: attendeeIds.map(id => ({
        user: id,
        status: 'invited'
      })),
      dateTime: {
        start: bestSuggestion.startTime,
        end: bestSuggestion.endTime,
        timeZone: 'UTC'
      },
      location,
      status: 'scheduled',
      metadata: {
        suggestedBy: 'ai',
        fetchaiAgentId: agentResult.agentId,
        optimizationScore: bestSuggestion.score
      }
    });

    await newMeeting.save();

    res.json({
      meeting: newMeeting,
      aiOptimization: {
        agentId: agentResult.agentId,
        suggestions: optimization.suggestions.slice(0, 3), // Top 3 alternatives
        score: bestSuggestion.score,
        reasoning: bestSuggestion.reasoning
      },
      message: 'Meeting scheduled with AI optimization'
    });

  } catch (error) {
    console.error('AI scheduling error:', error);
    res.status(500).json({ error: 'Failed to schedule meeting with AI' });
  }
});

/**
 * Get AI meeting optimization suggestions
 * POST /api/meeting/optimize
 */
router.post('/optimize', [
  authMiddleware,
  body('meetingId').notEmpty().withMessage('Meeting ID is required')
], async (req, res) => {
  try {
    const { meetingId } = req.body;

    const meeting = await Meeting.findById(meetingId)
      .populate('organizer', 'profile preferences')
      .populate('attendees.user', 'profile preferences');

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if user is organizer or attendee
    const userId = req.user.id;
    const isParticipant = meeting.organizer._id.toString() === userId || 
      meeting.attendees.some(a => a.user._id.toString() === userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create optimization agent if not exists
    let agentId = meeting.metadata?.fetchaiAgentId;
    if (!agentId) {
      const agentResult = await fetchaiService.createMeetingAgent({
        title: meeting.title,
        participants: [meeting.organizer, ...meeting.attendees.map(a => a.user)]
          .map(user => ({
            id: user._id.toString(),
            name: user.profile.fullName,
            timeZone: user.preferences?.meetingPreferences?.timeZone || 'UTC'
          })),
        duration: meeting.duration || 30
      });
      agentId = agentResult.agentId;

      // Update meeting with agent ID
      meeting.metadata = meeting.metadata || {};
      meeting.metadata.fetchaiAgentId = agentId;
      await meeting.save();
    }

    // Get optimization suggestions
    const participantAvailability = [meeting.organizer, ...meeting.attendees.map(a => a.user)]
      .map(user => ({
        userId: user._id.toString(),
        timeZone: user.preferences?.meetingPreferences?.timeZone || 'UTC',
        availability: generateAvailability(user) // Current availability
      }));

    const optimization = await fetchaiService.getOptimalMeetingTimes(
      agentId, 
      participantAvailability
    );

    res.json({
      currentMeeting: {
        id: meeting._id,
        title: meeting.title,
        dateTime: meeting.dateTime
      },
      optimization: {
        suggestions: optimization.suggestions,
        analysis: optimization.analysis,
        agentId: agentId
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Meeting optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize meeting' });
  }
});

/**
 * Schedule meeting with AI-powered suggestions
 * POST /api/meeting/schedule
 */
router.post('/schedule', [
  body('targetUserId').isString().notEmpty(),
  body('title').optional().isString(),
  body('duration').optional().isIn(['15min', '30min', '45min', '60min']),
  body('format').optional().isIn(['virtual', 'in-person', 'hybrid'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { clerkId } = req.user;
    const { targetUserId, title, duration = '30min', format = 'virtual' } = req.body;

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

    // Create meeting with AI-suggested details
    const meetingTitle = title || `Networking Meeting: ${currentUser.profile?.firstName} & ${targetUser.profile?.firstName}`;
    
    // Calculate meeting time (24 hours from now as default)
    const meetingTime = new Date();
    meetingTime.setDate(meetingTime.getDate() + 1);
    meetingTime.setHours(14, 0, 0, 0); // Default to 2 PM

    const newMeeting = new Meeting({
      title: meetingTitle,
      organizer: currentUser._id,
      attendees: [
        { user: targetUser._id, status: 'pending' }
      ],
      dateTime: {
        start: meetingTime,
        end: new Date(meetingTime.getTime() + (duration === '15min' ? 15 : duration === '30min' ? 30 : duration === '45min' ? 45 : 60) * 60000)
      },
      format: format,
      status: 'scheduled',
      aiSuggestions: {
        topics: ['Professional background', 'Industry insights', 'Collaboration opportunities'],
        agenda: ['Introductions', 'Share experiences', 'Explore synergies', 'Next steps']
      },
      createdBy: 'ai-matching-system'
    });

    await newMeeting.save();

    // Populate the saved meeting
    const populatedMeeting = await Meeting.findById(newMeeting._id)
      .populate('organizer', 'profile')
      .populate('attendees.user', 'profile');

    res.json({
      success: true,
      meeting: populatedMeeting,
      message: `Meeting scheduled with ${targetUser.profile?.firstName} ${targetUser.profile?.lastName}`
    });

  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate meeting URL for video calls
 */
function generateMeetingUrl() {
  const meetingId = Math.random().toString(36).substring(2, 15);
  return `https://meet.example.com/room/${meetingId}`;
}

/**
 * Generate available time slots (simplified implementation)
 */
function generateAvailableSlots(startDate, endDate, duration, meetings, availabilityData) {
  const slots = [];
  const current = new Date(startDate);
  current.setHours(9, 0, 0, 0); // Start at 9 AM
  
  while (current < endDate) {
    const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if any participant is available on this day
    const someoneAvailable = availabilityData.some(data => 
      data.availability.preferredDays.includes(dayOfWeek)
    );
    
    if (someoneAvailable && current.getHours() >= 9 && current.getHours() < 17) {
      // Check for conflicts with existing meetings
      const hasConflict = meetings.some(meeting => {
        const meetingStart = new Date(meeting.scheduledTime);
        const meetingEnd = new Date(meetingStart.getTime() + meeting.duration * 60000);
        const slotEnd = new Date(current.getTime() + duration * 60000);
        
        return (current < meetingEnd && slotEnd > meetingStart);
      });
      
      if (!hasConflict) {
        slots.push({
          startTime: new Date(current),
          endTime: new Date(current.getTime() + duration * 60000),
          confidence: 0.8 // Simplified confidence score
        });
      }
    }
    
    // Move to next hour
    current.setHours(current.getHours() + 1);
    
    // Skip to next day at 9 AM if we've reached 6 PM
    if (current.getHours() >= 18) {
      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
    }
  }
  
  return slots.slice(0, 20); // Return max 20 slots
}

// Helper functions
function generateAvailability(user, dateRange, timePreference) {
  // Simplified availability generation
  // In production, this would integrate with calendar APIs
  const availability = [];
  const startDate = dateRange?.start ? new Date(dateRange.start) : new Date();
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    const timeSlots = getTimeSlots(timePreference);
    timeSlots.forEach(slot => {
      availability.push({
        start: new Date(date.toDateString() + ' ' + slot.start),
        end: new Date(date.toDateString() + ' ' + slot.end),
        available: true
      });
    });
  }

  return availability;
}

function getTimeSlots(preference) {
  switch (preference) {
    case 'morning':
      return [
        { start: '09:00', end: '12:00' }
      ];
    case 'afternoon':
      return [
        { start: '13:00', end: '17:00' }
      ];
    case 'evening':
      return [
        { start: '18:00', end: '20:00' }
      ];
    default:
      return [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' }
      ];
  }
}

function getEarliestTime(preference) {
  switch (preference) {
    case 'morning': return '09:00';
    case 'afternoon': return '13:00';
    case 'evening': return '18:00';
    default: return '09:00';
  }
}

function getLatestTime(preference) {
  switch (preference) {
    case 'morning': return '12:00';
    case 'afternoon': return '17:00';
    case 'evening': return '20:00';
    default: return '17:00';
  }
}

module.exports = router;
