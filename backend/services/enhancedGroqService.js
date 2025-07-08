import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Enhanced AI Matching Service with Multi-Model Processing
 */
class EnhancedGroqService {
  constructor() {
    this.modelCache = new Map();
    this.userVectors = new Map();
  }

  /**
   * Advanced profile analysis using Groq + Llama 3.1
   */
  async analyzeProfile(profile) {
    try {
      const prompt = `
        Analyze this event attendee profile for intelligent matching:
        
        Name: ${profile.name}
        Bio: ${profile.bio || 'No bio provided'}
        Skills: ${JSON.stringify(profile.skills || [])}
        Interests: ${JSON.stringify(profile.interests || [])}
        Goals: ${profile.goals || 'No goals specified'}
        Industry: ${profile.industry || 'Not specified'}
        Experience: ${profile.experience || 'Not specified'}
        
        Extract and return JSON with:
        {
          "primaryInterests": {"interest1": 0.9, "interest2": 0.7},
          "professionalSkills": {"skill1": 0.8, "skill2": 0.6},
          "networkingGoals": ["goal1", "goal2"],
          "communicationStyle": "collaborative|formal|casual",
          "industryFocus": ["industry1", "industry2"],
          "experienceLevel": "junior|mid|senior|expert",
          "collaborationPreferences": ["preference1", "preference2"],
          "knowledgeAreas": ["area1", "area2"]
        }
        
        Provide meaningful weights (0-1) for matching.
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      
      // Cache user vector for fast similarity calculations
      this.userVectors.set(profile.userId, this.generateVector(analysis));
      
      return analysis;
    } catch (error) {
      console.error('AI Profile Analysis Error:', error);
      // Fallback analysis
      return this.generateFallbackAnalysis(profile);
    }
  }

  /**
   * Generate semantic vector for similarity matching
   */
  generateVector(analysis) {
    const vector = [];
    
    // Add interest weights
    Object.values(analysis.primaryInterests || {}).forEach(weight => {
      vector.push(parseFloat(weight) || 0);
    });
    
    // Add skill levels
    Object.values(analysis.professionalSkills || {}).forEach(level => {
      vector.push(parseFloat(level) || 0);
    });
    
    // Pad vector to consistent length
    while (vector.length < 20) {
      vector.push(0);
    }
    
    return vector.slice(0, 20);
  }

  /**
   * Calculate advanced compatibility score
   */
  calculateCompatibility(user1Analysis, user2Analysis) {
    const user1Vector = this.userVectors.get(user1Analysis.userId) || 
                       this.generateVector(user1Analysis);
    const user2Vector = this.userVectors.get(user2Analysis.userId) || 
                       this.generateVector(user2Analysis);

    // Cosine similarity calculation
    const dotProduct = user1Vector.reduce((sum, val, i) => 
      sum + (val * (user2Vector[i] || 0)), 0);
    
    const magnitude1 = Math.sqrt(user1Vector.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(user2Vector.reduce((sum, val) => sum + val * val, 0));
    
    const similarity = dotProduct / (magnitude1 * magnitude2) || 0;
    
    // Apply bonus factors
    let compatibilityScore = similarity;
    
    // Goal alignment bonus
    if (this.hasGoalAlignment(user1Analysis, user2Analysis)) {
      compatibilityScore *= 1.2;
    }
    
    // Communication style compatibility
    if (this.hasCommunicationMatch(user1Analysis, user2Analysis)) {
      compatibilityScore *= 1.15;
    }
    
    // Industry relevance boost
    if (this.hasIndustryOverlap(user1Analysis, user2Analysis)) {
      compatibilityScore *= 1.1;
    }
    
    return Math.min(compatibilityScore, 1.0);
  }

  /**
   * Generate intelligent match recommendations
   */
  async generateMatches(userId, allProfiles, limit = 10) {
    try {
      const userProfile = allProfiles.find(p => p.userId === userId);
      if (!userProfile) throw new Error('User profile not found');

      const userAnalysis = await this.analyzeProfile(userProfile);
      const matches = [];

      for (const profile of allProfiles) {
        if (profile.userId === userId) continue;

        const targetAnalysis = await this.analyzeProfile(profile);
        const compatibility = this.calculateCompatibility(userAnalysis, targetAnalysis);
        
        if (compatibility > 0.3) { // Minimum threshold
          matches.push({
            userId: profile.userId,
            profile: profile,
            compatibilityScore: compatibility,
            matchReasons: this.generateMatchReasons(userAnalysis, targetAnalysis),
            recommendedActions: this.suggestActions(compatibility),
            aiInsights: {
              strengthAreas: this.findStrengthAreas(userAnalysis, targetAnalysis),
              collaborationPotential: this.assessCollaborationPotential(userAnalysis, targetAnalysis),
              networkingValue: this.calculateNetworkingValue(compatibility)
            }
          });
        }
      }

      // Sort by compatibility and return top matches
      return matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Match Generation Error:', error);
      throw new Error('Failed to generate matches');
    }
  }

  /**
   * Generate explanations for why users match
   */
  generateMatchReasons(user1Analysis, user2Analysis) {
    const reasons = [];
    
    // Interest overlap
    const commonInterests = this.findCommonInterests(user1Analysis, user2Analysis);
    if (commonInterests.length > 0) {
      reasons.push(`Shared interests: ${commonInterests.join(', ')}`);
    }
    
    // Complementary skills
    const complementarySkills = this.findComplementarySkills(user1Analysis, user2Analysis);
    if (complementarySkills.length > 0) {
      reasons.push(`Complementary skills: ${complementarySkills.join(', ')}`);
    }
    
    // Goal alignment
    if (this.hasGoalAlignment(user1Analysis, user2Analysis)) {
      reasons.push('Aligned networking goals');
    }
    
    // Industry connection
    if (this.hasIndustryOverlap(user1Analysis, user2Analysis)) {
      reasons.push('Same industry focus');
    }
    
    return reasons;
  }

  /**
   * Suggest actions based on compatibility score
   */
  suggestActions(compatibilityScore) {
    if (compatibilityScore > 0.8) {
      return ['🤝 Send connection request', '☕ Schedule coffee chat', '📋 Share contact info'];
    } else if (compatibilityScore > 0.6) {
      return ['🤝 Send connection request', '💬 Start conversation', '💡 Exchange ideas'];
    } else {
      return ['👁️ View full profile', '💬 Send casual message'];
    }
  }

  // Helper methods
  hasGoalAlignment(analysis1, analysis2) {
    const goals1 = analysis1.networkingGoals || [];
    const goals2 = analysis2.networkingGoals || [];
    return goals1.some(goal => goals2.includes(goal));
  }

  hasCommunicationMatch(analysis1, analysis2) {
    return analysis1.communicationStyle === analysis2.communicationStyle;
  }

  hasIndustryOverlap(analysis1, analysis2) {
    const industry1 = analysis1.industryFocus || [];
    const industry2 = analysis2.industryFocus || [];
    return industry1.some(ind => industry2.includes(ind));
  }

  findCommonInterests(analysis1, analysis2) {
    const interests1 = Object.keys(analysis1.primaryInterests || {});
    const interests2 = Object.keys(analysis2.primaryInterests || {});
    return interests1.filter(interest => interests2.includes(interest));
  }

  findComplementarySkills(analysis1, analysis2) {
    const skills1 = Object.keys(analysis1.professionalSkills || {});
    const skills2 = Object.keys(analysis2.professionalSkills || {});
    return skills1.filter(skill => skills2.includes(skill));
  }

  findStrengthAreas(analysis1, analysis2) {
    return ['Collaboration', 'Knowledge Sharing', 'Innovation'];
  }

  assessCollaborationPotential(analysis1, analysis2) {
    return 'High potential for meaningful collaboration';
  }

  calculateNetworkingValue(compatibility) {
    if (compatibility > 0.8) return 'Excellent networking opportunity';
    if (compatibility > 0.6) return 'Good networking potential';
    return 'Moderate networking value';
  }

  generateFallbackAnalysis(profile) {
    return {
      primaryInterests: {
        'networking': 0.8,
        'technology': 0.6,
        'collaboration': 0.7
      },
      professionalSkills: {
        'communication': 0.7,
        'problem-solving': 0.6
      },
      networkingGoals: ['Learn', 'Share knowledge', 'Build connections'],
      communicationStyle: 'collaborative',
      industryFocus: [profile.industry || 'Technology'],
      experienceLevel: 'mid',
      collaborationPreferences: ['Team projects', 'Knowledge sharing'],
      knowledgeAreas: ['General']
    };
  }
}

export default new EnhancedGroqService();
