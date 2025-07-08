const Groq = require('groq-sdk');

/**
 * Groq AI Service for intelligent matching and recommendations
 */
class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    this.model = 'llama3-8b-8192'; // Using Llama 3 8B model
  }

  /**
   * Calculate compatibility score between two users
   * @param {Object} user1 - First user profile
   * @param {Object} user2 - Second user profile
   * @returns {Promise<Object>} Match analysis and score
   */
  async calculateMatchScore(user1, user2) {
    try {
      const prompt = this.buildMatchPrompt(user1, user2);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI expert in professional networking and event attendee matching. Analyze user profiles and provide detailed compatibility scores and recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      return this.validateAndEnhanceMatchResult(response, user1, user2);

    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Failed to calculate match score with AI');
    }
  }

  /**
   * Generate personalized meeting suggestions
   * @param {Array} users - Array of matched users
   * @returns {Promise<Object>} Meeting suggestions
   */
  async generateMeetingSuggestions(users) {
    try {
      const prompt = this.buildMeetingPrompt(users);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI meeting coordinator. Create meaningful meeting suggestions based on user profiles and mutual interests.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Failed to generate meeting suggestions');
    }
  }

  /**
   * Analyze conversation context for smart replies
   * @param {Array} messages - Recent chat messages
   * @param {Object} currentUser - Current user profile
   * @returns {Promise<Object>} Conversation insights and suggestions
   */
  async analyzeConversation(messages, currentUser) {
    try {
      const prompt = this.buildConversationPrompt(messages, currentUser);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI conversation assistant. Analyze chat context and provide helpful insights and response suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      console.error('Groq API error:', error);
      return { suggestions: [], insights: [] };
    }
  }

  /**
   * Build matching prompt for AI analysis
   */
  buildMatchPrompt(user1, user2) {
    return `
Analyze the compatibility between these two event attendees and provide a detailed matching score:

User 1:
- Name: ${user1.profile.firstName} ${user1.profile.lastName}
- Professional Title: ${user1.profile.professionalTitle || 'Not specified'}
- Company: ${user1.profile.company || 'Not specified'}
- Location: ${user1.profile.location?.city || 'Not specified'}, ${user1.profile.location?.country || 'Not specified'}
- Skills & Expertise: ${user1.preferences.skills?.join(', ') || 'None listed'}
- Interests: ${user1.preferences.interests?.join(', ') || 'None listed'}
- Networking Goals: ${user1.preferences.networkingGoals?.join(', ') || 'None listed'}
- Bio: ${user1.profile.bio || 'No bio provided'}

User 2:
- Name: ${user2.profile.firstName} ${user2.profile.lastName}
- Professional Title: ${user2.profile.professionalTitle || 'Not specified'}
- Company: ${user2.profile.company || 'Not specified'}
- Location: ${user2.profile.location?.city || 'Not specified'}, ${user2.profile.location?.country || 'Not specified'}
- Skills & Expertise: ${user2.preferences.skills?.join(', ') || 'None listed'}
- Interests: ${user2.preferences.interests?.join(', ') || 'None listed'}
- Networking Goals: ${user2.preferences.networkingGoals?.join(', ') || 'None listed'}
- Bio: ${user2.profile.bio || 'No bio provided'}

Please return a JSON response with:
{
  "compatibilityScore": <number 0-100>,
  "reasoning": "<detailed explanation of the match based on professional goals, skills alignment, and mutual benefit>",
  "sharedInterests": ["<list of common interests>"],
  "complementarySkills": ["<skills that complement each other>"],
  "meetingTopics": ["<suggested conversation topics>"],
  "collaborationPotential": "<assessment of potential collaboration opportunities>",
  "networkingValue": "<mutual networking benefits and professional growth opportunities>",
  "matchCategories": ["<categories like 'skill-complementary', 'interest-aligned', 'goal-oriented', etc.>"]
}
    `;
  }

  /**
   * Build meeting suggestion prompt
   */
  buildMeetingPrompt(users) {
    const userProfiles = users.map(user => 
      `- ${user.profile.firstName} ${user.profile.lastName}: ${user.profile.professionalTitle || 'Professional'} at ${user.profile.company || 'Company'}, interested in: ${user.preferences.interests?.join(', ') || 'Various topics'}, networking goals: ${user.preferences.networkingGoals?.join(', ') || 'General networking'}`
    ).join('\n');

    return `
Based on these matched users, suggest meaningful meeting formats and topics:

${userProfiles}

Please return a JSON response with:
{
  "suggestions": [
    {
      "title": "<meeting title>",
      "format": "<virtual/in-person/hybrid>",
      "duration": "<15min/30min/45min/60min>",
      "topics": ["<discussion topics>"],
      "goals": ["<meeting objectives>"],
      "agenda": ["<suggested agenda items>"],
      "expectedOutcomes": ["<potential collaboration or connection outcomes>"]
    }
  ],
  "iceBreakers": ["<conversation starters>"],
  "followUpIdeas": ["<post-meeting collaboration ideas>"],
  "networkingOpportunities": ["<specific networking value propositions>"]
}
    `;
  }

  /**
   * Build conversation analysis prompt
   */
  buildConversationPrompt(messages, currentUser) {
    const recentMessages = messages.slice(-10).map(msg => 
      `${msg.sender.profile?.firstName || 'User'}: ${msg.content}`
    ).join('\n');

    return `
Analyze this conversation and provide helpful insights:

Recent messages:
${recentMessages}

Current user: ${currentUser.profile.firstName} ${currentUser.profile.lastName}

Please return a JSON response with:
{
  "insights": ["<conversation insights>"],
  "suggestedReplies": ["<helpful response suggestions>"],
  "topics": ["<discussion topics being covered>"],
  "sentiment": "<positive/neutral/negative>",
  "nextSteps": ["<suggested next actions>"]
}
    `;
  }

  /**
   * Validate and enhance match result
   */
  validateAndEnhanceMatchResult(response, user1, user2) {
    return {
      score: Math.max(0, Math.min(100, response.compatibilityScore || 0)),
      reasoning: response.reasoning || 'AI analysis completed',
      sharedInterests: response.sharedInterests || [],
      complementarySkills: response.complementarySkills || [],
      meetingTopics: response.meetingTopics || [],
      collaborationPotential: response.collaborationPotential || 'To be determined',
      networkingValue: response.networkingValue || 'Mutual benefit potential',
      generatedAt: new Date(),
      aiModel: this.model
    };
  }
}

module.exports = new GroqService();
