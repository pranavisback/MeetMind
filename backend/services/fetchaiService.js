const axios = require('axios');

/**
 * Fetch.ai Agent Service for autonomous meeting scheduling and coordination
 */
class FetchAIService {
  constructor() {
    if (!process.env.FETCHAI_API_KEY) {
      throw new Error('FETCHAI_API_KEY environment variable is required');
    }

    this.apiKey = process.env.FETCHAI_API_KEY;
    this.baseURL = 'https://api.fetch.ai/v1'; // Update with actual Fetch.ai API endpoint
    this.agentEndpoint = '/agents';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Create a meeting scheduling agent
   * @param {Object} meetingData - Meeting details and participants
   * @returns {Promise<Object>} Agent creation response
   */
  async createMeetingAgent(meetingData) {
    try {
      const agentConfig = {
        name: `meeting_scheduler_${Date.now()}`,
        type: 'meeting_coordinator',
        capabilities: [
          'schedule_optimization',
          'participant_coordination',
          'availability_checking',
          'conflict_resolution'
        ],
        parameters: {
          meeting: {
            title: meetingData.title,
            participants: meetingData.participants,
            preferredDuration: meetingData.duration || 30,
            timeZone: meetingData.timeZone || 'UTC',
            constraints: {
              earliestTime: meetingData.constraints?.earliestTime || '09:00',
              latestTime: meetingData.constraints?.latestTime || '17:00',
              excludeWeekends: meetingData.constraints?.excludeWeekends || true
            }
          },
          optimization: {
            priority: 'participant_convenience', // or 'time_efficiency'
            allowOverlap: false,
            bufferTime: 15 // minutes between meetings
          }
        }
      };

      const response = await this.axiosInstance.post(this.agentEndpoint, agentConfig);
      
      return {
        agentId: response.data.id,
        status: response.data.status,
        capabilities: response.data.capabilities,
        createdAt: new Date(),
        meetingData: meetingData
      };

    } catch (error) {
      console.error('Fetch.ai API error:', error.response?.data || error.message);
      throw new Error('Failed to create meeting scheduling agent');
    }
  }

  /**
   * Query agent for optimal meeting times
   * @param {string} agentId - Agent identifier
   * @param {Array} participantAvailability - Availability data for participants
   * @returns {Promise<Object>} Optimized meeting suggestions
   */
  async getOptimalMeetingTimes(agentId, participantAvailability) {
    try {
      const queryData = {
        action: 'optimize_schedule',
        parameters: {
          participants: participantAvailability,
          constraints: {
            duration: 30, // minutes
            timeZone: 'UTC',
            dateRange: {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
            }
          }
        }
      };

      const response = await this.axiosInstance.post(
        `${this.agentEndpoint}/${agentId}/query`,
        queryData
      );

      return this.processScheduleOptimization(response.data);

    } catch (error) {
      console.error('Agent query error:', error.response?.data || error.message);
      throw new Error('Failed to get optimal meeting times');
    }
  }

  /**
   * Create a networking agent for event attendee matching
   * @param {Object} eventData - Event and attendee information
   * @returns {Promise<Object>} Networking agent response
   */
  async createNetworkingAgent(eventData) {
    try {
      const agentConfig = {
        name: `networking_agent_${eventData.eventId}`,
        type: 'networking_coordinator',
        capabilities: [
          'attendee_analysis',
          'connection_recommendations',
          'interaction_facilitation',
          'follow_up_coordination'
        ],
        parameters: {
          event: {
            id: eventData.eventId,
            name: eventData.eventName,
            attendees: eventData.attendees,
            duration: eventData.duration,
            goals: eventData.goals || ['networking', 'knowledge_sharing']
          },
          matching: {
            algorithm: 'ai_enhanced', // or 'rule_based'
            factors: ['skills', 'interests', 'goals', 'experience_level'],
            weights: {
              skills: 0.3,
              interests: 0.25,
              goals: 0.25,
              experience: 0.2
            }
          }
        }
      };

      const response = await this.axiosInstance.post(this.agentEndpoint, agentConfig);
      
      return {
        agentId: response.data.id,
        status: response.data.status,
        eventId: eventData.eventId,
        capabilities: response.data.capabilities,
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Networking agent creation error:', error.response?.data || error.message);
      throw new Error('Failed to create networking agent');
    }
  }

  /**
   * Get networking recommendations from agent
   * @param {string} agentId - Networking agent ID
   * @param {string} userId - User requesting recommendations
   * @returns {Promise<Object>} Networking recommendations
   */
  async getNetworkingRecommendations(agentId, userId) {
    try {
      const queryData = {
        action: 'recommend_connections',
        parameters: {
          userId: userId,
          maxRecommendations: 10,
          filters: {
            excludeExistingConnections: true,
            minimumMatchScore: 70
          }
        }
      };

      const response = await this.axiosInstance.post(
        `${this.agentEndpoint}/${agentId}/query`,
        queryData
      );

      return this.processNetworkingRecommendations(response.data);

    } catch (error) {
      console.error('Networking query error:', error.response?.data || error.message);
      throw new Error('Failed to get networking recommendations');
    }
  }

  /**
   * Monitor agent status and performance
   * @param {string} agentId - Agent identifier
   * @returns {Promise<Object>} Agent status and metrics
   */
  async getAgentStatus(agentId) {
    try {
      const response = await this.axiosInstance.get(`${this.agentEndpoint}/${agentId}/status`);
      
      return {
        agentId: agentId,
        status: response.data.status,
        uptime: response.data.uptime,
        tasksCompleted: response.data.metrics?.tasksCompleted || 0,
        successRate: response.data.metrics?.successRate || 0,
        lastActivity: response.data.lastActivity,
        performance: response.data.performance || {}
      };

    } catch (error) {
      console.error('Agent status error:', error.response?.data || error.message);
      return {
        agentId: agentId,
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Process schedule optimization results
   */
  processScheduleOptimization(data) {
    return {
      suggestions: data.suggestions?.map(suggestion => ({
        startTime: new Date(suggestion.startTime),
        endTime: new Date(suggestion.endTime),
        score: suggestion.optimizationScore || 0,
        participants: suggestion.participants || [],
        conflicts: suggestion.conflicts || [],
        reasoning: suggestion.reasoning || ''
      })) || [],
      analysis: {
        totalOptions: data.totalOptions || 0,
        optimalScore: data.optimalScore || 0,
        constraints: data.appliedConstraints || [],
        recommendations: data.recommendations || []
      },
      processedAt: new Date()
    };
  }

  /**
   * Process networking recommendations
   */
  processNetworkingRecommendations(data) {
    return {
      recommendations: data.recommendations?.map(rec => ({
        userId: rec.userId,
        matchScore: rec.score || 0,
        reasoning: rec.reasoning || '',
        sharedInterests: rec.sharedInterests || [],
        suggestedTopics: rec.suggestedTopics || [],
        meetingFormat: rec.recommendedFormat || 'virtual',
        priority: rec.priority || 'medium'
      })) || [],
      analysis: {
        totalCandidates: data.totalCandidates || 0,
        averageScore: data.averageScore || 0,
        categories: data.categories || {},
        insights: data.insights || []
      },
      processedAt: new Date()
    };
  }

  /**
   * Terminate an agent
   * @param {string} agentId - Agent to terminate
   * @returns {Promise<boolean>} Success status
   */
  async terminateAgent(agentId) {
    try {
      await this.axiosInstance.delete(`${this.agentEndpoint}/${agentId}`);
      return true;
    } catch (error) {
      console.error('Agent termination error:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new FetchAIService();
