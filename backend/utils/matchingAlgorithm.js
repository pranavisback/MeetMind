const groqService = require('../services/groqService');

/**
 * Advanced matching algorithm with AI-powered analysis
 */
class MatchingAlgorithm {
  constructor() {
    this.weights = {
      skills: 0.3,
      interests: 0.25,
      goals: 0.25,
      experience: 0.15,
      location: 0.05
    };
  }

  /**
   * Calculate compatibility score between two users using AI
   * @param {Object} user1 - First user profile
   * @param {Object} user2 - Second user profile
   * @returns {Promise<Object>} Match result with AI analysis
   */
  async calculateMatch(user1, user2) {
    try {
      // Get AI-powered analysis from Groq
      const aiAnalysis = await groqService.calculateMatchScore(user1, user2);
      
      // Combine with traditional algorithm for fallback
      const traditionalScore = this.calculateTraditionalScore(user1, user2);
      
      return {
        score: aiAnalysis.score,
        aiScore: aiAnalysis.score,
        traditionalScore: traditionalScore.score,
        reasoning: aiAnalysis.reasoning,
        sharedInterests: aiAnalysis.sharedInterests,
        complementarySkills: aiAnalysis.complementarySkills,
        meetingTopics: aiAnalysis.meetingTopics,
        collaborationPotential: aiAnalysis.collaborationPotential,
        networkingValue: aiAnalysis.networkingValue,
        breakdown: {
          ...traditionalScore.breakdown,
          aiModel: aiAnalysis.aiModel,
          generatedAt: aiAnalysis.generatedAt
        }
      };
    } catch (error) {
      console.error('AI matching failed, falling back to traditional algorithm:', error);
      
      // Fallback to traditional matching
      const traditionalScore = this.calculateTraditionalScore(user1, user2);
      return {
        ...traditionalScore,
        aiScore: null,
        reasoning: 'Traditional algorithm used (AI unavailable)',
        fallback: true
      };
    }
  }

  /**
   * Traditional matching algorithm (fallback)
   * @param {Object} user1 - First user profile
   * @param {Object} user2 - Second user profile
   * @returns {Object} Match result
   */
  calculateTraditionalScore(user1, user2) {
    const profile1 = user1.preferences || {};
    const profile2 = user2.preferences || {};
    
    let totalScore = 0;
    let totalWeight = 0;
    const breakdown = {};

    // Skills similarity
    const skillsScore = this.calculateArraySimilarity(profile1.skills || [], profile2.skills || []);
    breakdown.skills = skillsScore;
    totalScore += skillsScore * this.weights.skills;
    totalWeight += this.weights.skills;

    // Interests similarity
    const interestsScore = this.calculateArraySimilarity(profile1.interests || [], profile2.interests || []);
    breakdown.interests = interestsScore;
    totalScore += interestsScore * this.weights.interests;
    totalWeight += this.weights.interests;

    // Goals similarity
    const goalsScore = this.calculateArraySimilarity(profile1.goals || [], profile2.goals || []);
    breakdown.goals = goalsScore;
    totalScore += goalsScore * this.weights.goals;
    totalWeight += this.weights.goals;

    // Job/Industry similarity
    const jobScore = this.calculateJobSimilarity(user1.profile, user2.profile);
    breakdown.experience = jobScore;
    totalScore += jobScore * this.weights.experience;
    totalWeight += this.weights.experience;

    // Location similarity
    const locationScore = this.calculateLocationSimilarity(user1.profile?.location, user2.profile?.location);
    breakdown.location = locationScore;
    totalScore += locationScore * this.weights.location;
    totalWeight += this.weights.location;

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    return {
      score: Math.round(finalScore),
      breakdown,
      sharedInterests: this.findSharedItems(profile1.interests || [], profile2.interests || []),
      complementarySkills: this.findComplementaryItems(profile1.skills || [], profile2.skills || []),
      meetingTopics: this.generateMeetingTopics(profile1, profile2),
      collaborationPotential: 'To be determined through interaction',
      networkingValue: 'Mutual professional benefit possible'
    };
  }

  /**
   * Calculate similarity between two arrays using Jaccard index
   */
  calculateArraySimilarity(array1, array2) {
    if (array1.length === 0 && array2.length === 0) return 50; // Neutral score
    if (array1.length === 0 || array2.length === 0) return 0;

    const set1 = new Set(array1.map(item => item.toLowerCase()));
    const set2 = new Set(array2.map(item => item.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  /**
   * Calculate job/industry similarity
   */
  calculateJobSimilarity(profile1, profile2) {
    let score = 0;
    
    // Company similarity
    if (profile1.company && profile2.company) {
      if (profile1.company.toLowerCase() === profile2.company.toLowerCase()) {
        score += 50; // Same company
      } else if (this.isSimilarIndustry(profile1.company, profile2.company)) {
        score += 30; // Similar industry
      }
    }
    
    // Job title similarity
    if (profile1.jobTitle && profile2.jobTitle) {
      const title1 = profile1.jobTitle.toLowerCase();
      const title2 = profile2.jobTitle.toLowerCase();
      
      if (title1 === title2) {
        score += 50; // Same job title
      } else if (this.isSimilarJobTitle(title1, title2)) {
        score += 30; // Similar job title
      }
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate location similarity
   */
  calculateLocationSimilarity(location1, location2) {
    if (!location1 || !location2) return 25; // Neutral if one is missing
    
    const loc1 = location1.toLowerCase();
    const loc2 = location2.toLowerCase();
    
    if (loc1 === loc2) return 100; // Same location
    
    // Check for city/state/country matches
    const parts1 = loc1.split(',').map(part => part.trim());
    const parts2 = loc2.split(',').map(part => part.trim());
    
    const commonParts = parts1.filter(part => parts2.includes(part));
    
    if (commonParts.length > 0) {
      return (commonParts.length / Math.max(parts1.length, parts2.length)) * 100;
    }
    
    return 0;
  }

  /**
   * Find shared items between arrays
   */
  findSharedItems(array1, array2) {
    const set1 = new Set(array1.map(item => item.toLowerCase()));
    const set2 = new Set(array2.map(item => item.toLowerCase()));
    return [...set1].filter(x => set2.has(x));
  }

  /**
   * Find complementary items (different but potentially synergistic)
   */
  findComplementaryItems(skills1, skills2) {
    // Simple heuristic - could be enhanced with domain knowledge
    const complementaryPairs = {
      'frontend': ['backend', 'api', 'database'],
      'backend': ['frontend', 'ui', 'design'],
      'design': ['development', 'programming', 'coding'],
      'marketing': ['product', 'development', 'analytics'],
      'sales': ['marketing', 'business development'],
      'data': ['analytics', 'visualization', 'reporting']
    };

    const complementary = [];
    skills1.forEach(skill1 => {
      const skill1Lower = skill1.toLowerCase();
      skills2.forEach(skill2 => {
        const skill2Lower = skill2.toLowerCase();
        Object.entries(complementaryPairs).forEach(([key, values]) => {
          if (skill1Lower.includes(key) && values.some(v => skill2Lower.includes(v))) {
            complementary.push(`${skill1} + ${skill2}`);
          }
        });
      });
    });

    return complementary;
  }

  /**
   * Generate meeting topics based on profiles
   */
  generateMeetingTopics(profile1, profile2) {
    const topics = [];
    const allInterests = [...(profile1.interests || []), ...(profile2.interests || [])];
    const allSkills = [...(profile1.skills || []), ...(profile2.skills || [])];
    
    // Add common interests
    const shared = this.findSharedItems(profile1.interests || [], profile2.interests || []);
    shared.forEach(interest => topics.push(`Discussing ${interest}`));
    
    // Add skill sharing opportunities
    if (allSkills.length > 0) {
      topics.push('Knowledge sharing and skill exchange');
    }
    
    // Add professional development
    topics.push('Professional networking and career insights');
    
    return topics.slice(0, 5); // Limit to 5 topics
  }

  /**
   * Check if companies are in similar industries (simple heuristic)
   */
  isSimilarIndustry(company1, company2) {
    const techKeywords = ['tech', 'software', 'digital', 'ai', 'data', 'cloud'];
    const financeKeywords = ['bank', 'finance', 'investment', 'capital'];
    const healthKeywords = ['health', 'medical', 'pharma', 'biotech'];
    
    const industryGroups = [techKeywords, financeKeywords, healthKeywords];
    
    const comp1Lower = company1.toLowerCase();
    const comp2Lower = company2.toLowerCase();
    
    return industryGroups.some(keywords => 
      keywords.some(keyword => comp1Lower.includes(keyword)) &&
      keywords.some(keyword => comp2Lower.includes(keyword))
    );
  }

  /**
   * Check if job titles are similar
   */
  isSimilarJobTitle(title1, title2) {
    const managerKeywords = ['manager', 'director', 'lead', 'head'];
    const devKeywords = ['developer', 'engineer', 'programmer', 'architect'];
    const designKeywords = ['designer', 'creative', 'ux', 'ui'];
    
    const roleGroups = [managerKeywords, devKeywords, designKeywords];
    
    return roleGroups.some(keywords => 
      keywords.some(keyword => title1.includes(keyword)) &&
      keywords.some(keyword => title2.includes(keyword))
    );
  }

  /**
   * Find best matches for a user from a pool of candidates
   */
  async findBestMatches(targetUser, candidates, limit = 10) {
    const matches = [];
    
    for (const candidate of candidates) {
      if (candidate.id === targetUser.id) continue; // Skip self
      
      const matchResult = await this.calculateMatch(targetUser, candidate);
      matches.push({
        user: candidate,
        ...matchResult
      });
    }
    
    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = new MatchingAlgorithm();
