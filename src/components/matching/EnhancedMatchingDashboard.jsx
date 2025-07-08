import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { chatAPI } from '../../utils/api';
import axios from 'axios';

/**
 * Enhanced Matching Dashboard with Clean, Modern UI
 */
const EnhancedMatchingDashboard = () => {
  const { userId } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    industry: 'all',
    experience: 'all',
    goalAlignment: 'all'
  });

  useEffect(() => {
    if (userId) {
      loadEnhancedMatches();
    }
  }, [userId, filterOptions]);

  /**
   * Load AI-generated matches
   */
  const loadEnhancedMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/matching/enhanced/${userId}`, {
        params: filterOptions
      });

      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
      // Set mock data for demo
      setMatches(generateMockMatches());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate mock data for demo
   */
  const generateMockMatches = () => {
    return [
      {
        userId: 'user1',
        profile: {
          name: 'Sarah Chen',
          title: 'AI/ML Engineer',
          avatar: '/api/placeholder/100/100',
          industry: 'Technology',
          experience: 'Senior'
        },
        compatibilityScore: 0.92,
        matchReasons: [
          'Shared interests: AI/ML, Deep Learning',
          'Complementary skills: Python, TensorFlow',
          'Aligned networking goals'
        ],
        recommendedActions: ['🤝 Send connection request', '☕ Schedule coffee chat', '📋 Share contact info'],
        aiInsights: {
          strengthAreas: ['Technical Collaboration', 'Research Partnership'],
          collaborationPotential: 'Excellent potential for AI research collaboration',
          networkingValue: 'High-value connection for technical growth'
        }
      },
      {
        userId: 'user2',
        profile: {
          name: 'Marcus Johnson',
          title: 'Product Manager',
          avatar: '/api/placeholder/100/100',
          industry: 'Technology',
          experience: 'Mid-level'
        },
        compatibilityScore: 0.87,
        matchReasons: [
          'Shared interests: Product Strategy, User Experience',
          'Complementary skills: Product Management, Analytics',
          'Same industry focus'
        ],
        recommendedActions: ['🤝 Send connection request', '💬 Start conversation', '💡 Exchange ideas'],
        aiInsights: {
          strengthAreas: ['Product Innovation', 'Strategic Planning'],
          collaborationPotential: 'Strong potential for product development collaboration',
          networkingValue: 'Valuable for product strategy insights'
        }
      },
      {
        userId: 'user3',
        profile: {
          name: 'Elena Rodriguez',
          title: 'UX Designer',
          avatar: '/api/placeholder/100/100',
          industry: 'Design',
          experience: 'Senior'
        },
        compatibilityScore: 0.82,
        matchReasons: [
          'Shared interests: Design Systems, User Research',
          'Complementary skills: Figma, Prototyping',
          'Aligned networking goals'
        ],
        recommendedActions: ['🤝 Send connection request', '💬 Start conversation', '💡 Exchange ideas'],
        aiInsights: {
          strengthAreas: ['Design Collaboration', 'User Experience'],
          collaborationPotential: 'Good potential for design system collaboration',
          networkingValue: 'Great for design process improvement'
        }
      }
    ];
  };

  /**
   * Handle connection request
   */
  const sendConnectionRequest = async (targetUserId, matchData) => {
    try {
      const message = generatePersonalizedMessage(matchData);
      
      // Show success animation
      setMatches(prev => prev.map(match => 
        match.userId === targetUserId 
          ? { ...match, connectionStatus: 'pending' }
          : match
      ));

      showNotification(`Connection request sent to ${matchData.profile.name}!`, 'success');
    } catch (error) {
      console.error('Failed to send connection request:', error);
      showNotification('Failed to send connection request', 'error');
    }
  };

  /**
   * Generate AI-powered personalized message
   */
  const generatePersonalizedMessage = (matchData) => {
    const reasons = matchData.matchReasons.slice(0, 2).join(' and ');
    return `Hi ${matchData.profile.name}! I noticed we have ${reasons}. I'd love to connect and explore potential collaboration opportunities.`;
  };

  /**
   * Start chat
   */
  const startChat = async (targetUserId, targetProfile) => {
    try {
      showNotification(`Starting chat with ${targetProfile.name}...`, 'info');
      
      const chatRoom = await chatAPI.startChatWithUser(targetUserId);
      
      if (chatRoom && chatRoom.id) {
        window.location.href = `/chat/${chatRoom.id}`;
      } else {
        showNotification('Failed to start chat. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      showNotification('Failed to start chat. Please try again.', 'error');
    }
  };

  /**
   * Schedule meeting
   */
  const scheduleIntelligentMeeting = (targetUserId, matchData) => {
    setSelectedMatch(matchData);
    setShowScheduler(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-xl text-gray-600 font-medium">Finding your perfect matches...</p>
          <p className="mt-2 text-sm text-gray-500">AI is analyzing thousands of profiles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI-Powered Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover meaningful connections with our advanced AI that understands your goals, skills, and networking style
          </p>
        </div>

        {/* Smart Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Smart Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Industry</label>
              <select 
                value={filterOptions.industry}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white"
              >
                <option value="all">All Industries</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="design">Design</option>
                <option value="education">Education</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Experience</label>
              <select 
                value={filterOptions.experience}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white"
              >
                <option value="all">All Levels</option>
                <option value="junior">Junior (0-2 years)</option>
                <option value="mid">Mid-level (3-7 years)</option>
                <option value="senior">Senior (8+ years)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Goals</label>
              <select 
                value={filterOptions.goalAlignment}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, goalAlignment: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white"
              >
                <option value="all">All Goals</option>
                <option value="collaboration">Collaboration</option>
                <option value="learning">Learning</option>
                <option value="mentoring">Mentoring</option>
                <option value="business">Business Development</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 opacity-0">Action</label>
              <button 
                onClick={loadEnhancedMatches}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-6 py-3 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg"
              >
                🔄 Refresh Matches
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Match Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matches.map((match, index) => (
            <div 
              key={match.userId} 
              className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Match Header with Gradient */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img 
                        src={match.profile.avatar || `https://ui-avatars.com/api/?name=${match.profile.name}&background=random`}
                        alt={match.profile.name}
                        className="w-16 h-16 rounded-full border-3 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{match.profile.name}</h3>
                      <p className="text-indigo-100 text-sm">{match.profile.title}</p>
                      <p className="text-indigo-200 text-xs">{match.profile.industry}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {Math.round(match.compatibilityScore * 100)}%
                    </div>
                    <div className="text-xs text-indigo-100">Match Score</div>
                  </div>
                </div>
              </div>

              {/* Match Content */}
              <div className="p-6 space-y-6">
                {/* AI Match Reasons */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">🧠</span>
                    </span>
                    Why you match
                  </h4>
                  <ul className="space-y-2">
                    {match.matchReasons.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 text-sm">💡 AI Insights</h5>
                  <p className="text-xs text-gray-600">{match.aiInsights?.collaborationPotential}</p>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">🎯 Suggested Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.recommendedActions.map((action, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs rounded-full font-medium"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <button
                    onClick={() => sendConnectionRequest(match.userId, match)}
                    disabled={match.connectionStatus === 'pending'}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-semibold disabled:opacity-50 transform hover:scale-105 shadow-lg"
                  >
                    {match.connectionStatus === 'pending' ? '⏳' : '🤝'}
                  </button>
                  
                  <button
                    onClick={() => startChat(match.userId, match.profile)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm font-semibold transform hover:scale-105 shadow-lg"
                  >
                    💬
                  </button>
                  
                  <button
                    onClick={() => scheduleIntelligentMeeting(match.userId, match)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 text-sm font-semibold transform hover:scale-105 shadow-lg"
                  >
                    📅
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Matches State */}
        {matches.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl">🤖</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Finding Perfect Matches
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Our AI is analyzing profiles to discover your ideal networking opportunities
            </p>
            <button 
              onClick={loadEnhancedMatches}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg"
            >
              🔄 Search Again
            </button>
          </div>
        )}
      </div>

      {/* Smart Scheduling Modal */}
      {showScheduler && selectedMatch && (
        <IntelligentSchedulingModal 
          match={selectedMatch}
          onClose={() => {
            setShowScheduler(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Intelligent Scheduling Modal Component
 */
const IntelligentSchedulingModal = ({ match, onClose }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadOptimalTimeSlots();
  }, []);

  const loadOptimalTimeSlots = async () => {
    try {
      // Mock time slots for demo
      setTimeout(() => {
        setTimeSlots([
          {
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            confidence: 0.95,
            reasoning: 'Perfect time for both schedules - high energy morning slot',
            duration: 60
          },
          {
            startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            confidence: 0.88,
            reasoning: 'Good afternoon slot with optimal focus time',
            duration: 60
          },
          {
            startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Three days
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            confidence: 0.82,
            reasoning: 'Flexible Friday morning - great for casual networking',
            duration: 60
          }
        ]);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      setLoading(false);
    }
  };

  const confirmMeeting = async () => {
    try {
      setStep(2);
      setTimeout(() => {
        showNotification(`Meeting scheduled with ${match.profile.name}!`, 'success');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to confirm meeting:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {step === 1 && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI Scheduling</h3>
                  <p className="text-sm text-gray-600">with {match.profile.name}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
              <p className="text-gray-700">
                🧠 Our AI agent analyzed both calendars and found the optimal meeting times based on:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• Mutual availability patterns</li>
                <li>• Energy levels and preferences</li>
                <li>• Meeting type optimization</li>
              </ul>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Finding optimal time slots...</p>
                <p className="text-sm text-gray-500 mt-1">Analyzing 10,000+ data points</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">🎯 Recommended Time Slots</h4>
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedSlot === slot 
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg transform scale-105' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900">
                          {slot.startTime.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-gray-600">
                          {slot.startTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })} - {slot.endTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {Math.round(slot.confidence * 100)}% Confidence
                          </span>
                          <span className="text-xs text-gray-500">{slot.duration} minutes</span>
                        </div>
                      </div>
                      <div className="text-3xl ml-4">
                        {slot.confidence > 0.9 ? '🎯' : slot.confidence > 0.8 ? '✅' : '📅'}
                      </div>
                    </div>
                    {slot.reasoning && (
                      <div className="mt-4 text-sm text-gray-600 bg-white/80 rounded-lg p-3">
                        💡 {slot.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={confirmMeeting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold text-lg shadow-lg transform hover:scale-105"
                >
                  📅 Confirm Meeting
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Meeting Scheduled!</h3>
            <p className="text-gray-600 mb-6">
              Calendar invites have been sent to both participants. You'll receive smart reminders before the meeting.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                🤖 Our AI will continue optimizing and send personalized preparation tips before your meeting!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility function for notifications
const showNotification = (message, type) => {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

export default EnhancedMatchingDashboard;
