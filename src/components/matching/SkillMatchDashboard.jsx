import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../../contexts/ToastContext';
import { chatAPI } from '../../utils/api';
import axios from 'axios';

/**
 * Skill-based Matching Dashboard using Groq AI
 */
const SkillMatchDashboard = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    limit: 10,
    minScore: 60
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadMatches();
    }
  }, [isLoaded, isSignedIn, filterOptions]);

  /**
   * Load AI-powered matches using Groq
   */
  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      const response = await axios.get('/api/matching/enhanced', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: filterOptions
      });

      if (response.data.success) {
        setMatches(response.data.matches || []);
      } else {
        throw new Error(response.data.error || 'Failed to load matches');
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
      setError('Failed to load matches. Please try again.');
      // Set empty array instead of mock data
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get detailed match analysis
   */
  const getMatchDetails = async (match) => {
    try {
      const token = await getToken();
      const response = await axios.get(`/api/matching/details/${match.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSelectedMatch({
          ...match,
          details: response.data.matchDetails
        });
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Failed to get match details:', error);
    }
  };

  /**
   * Start a chat with a matched user
   */
  const startChat = async (match) => {
    try {
      const chatRoom = await chatAPI.startChatWithUser(match.userId);
      
      if (chatRoom && chatRoom.id) {
        // Navigate to chat page
        window.location.href = `/chat/${chatRoom.id}`;
      } else {
        console.error('No chat room returned from API');
        showError('Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      showError('Failed to start chat. Please try again.');
    }
  };

  /**
   * Schedule a meeting with a matched user
   */
  const scheduleMeeting = async (match) => {
    try {
      const token = await getToken();
      const response = await axios.post('/api/meeting/schedule', {
        targetUserId: match.userId,
        title: `Networking Meeting with ${match.profile?.firstName} ${match.profile?.lastName}`,
        duration: '30min',
        format: 'virtual'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showSuccess('Meeting scheduled successfully!');
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-xl text-gray-600 font-medium">Finding your perfect matches...</p>
          <p className="mt-2 text-sm text-gray-500">AI is analyzing skills and networking goals</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Skill Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover professionals who complement your skills and share your networking goals using advanced AI analysis
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Matches
              </label>
              <select 
                value={filterOptions.limit}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 matches</option>
                <option value={10}>10 matches</option>
                <option value={20}>20 matches</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Compatibility Score
              </label>
              <select 
                value={filterOptions.minScore}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={50}>50% and above</option>
                <option value={60}>60% and above</option>
                <option value={70}>70% and above</option>
                <option value={80}>80% and above</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={loadMatches}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                Refresh Matches
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Matches</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length === 0 && !error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Matches Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or complete your profile to get better matches.
            </p>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches.map((match, index) => (
              <MatchCard 
                key={match.userId || index}
                match={match}
                onViewDetails={() => getMatchDetails(match)}
                onStartChat={() => startChat(match)}
                onScheduleMeeting={() => scheduleMeeting(match)}
              />
            ))}
          </div>
        )}

        {/* Match Details Modal */}
        {showDetails && selectedMatch && (
          <MatchDetailsModal 
            match={selectedMatch}
            onClose={() => setShowDetails(false)}
            onStartChat={() => startChat(selectedMatch)}
            onScheduleMeeting={() => scheduleMeeting(selectedMatch)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Individual Match Card Component
 */
const MatchCard = ({ match, onViewDetails, onStartChat, onScheduleMeeting }) => {
  const { profile, compatibility, matchScore } = match;
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '🎯';
    if (score >= 60) return '👍';
    return '👌';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
            {profile?.firstName?.charAt(0) || '👤'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {profile?.firstName} {profile?.lastName}
            </h3>
            <p className="text-blue-100">
              {profile?.professionalTitle || 'Professional'}
            </p>
            <p className="text-blue-100 text-sm">
              {profile?.company || 'Company'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matchScore)}`}>
            {getScoreIcon(matchScore)} {matchScore}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Location */}
        {profile?.location && (
          <div className="flex items-center text-gray-600 mb-4">
            <span className="mr-2">📍</span>
            <span className="text-sm">
              {profile.location.city}, {profile.location.country}
            </span>
          </div>
        )}

        {/* AI Insights */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">AI Match Insights</h4>
          <p className="text-sm text-gray-600 mb-3">
            {compatibility?.reasoning || 'Analyzing compatibility...'}
          </p>
          
          {/* Shared Interests */}
          {compatibility?.sharedInterests?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Shared Interests:</p>
              <div className="flex flex-wrap gap-1">
                {compatibility.sharedInterests.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Complementary Skills */}
          {compatibility?.complementarySkills?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Complementary Skills:</p>
              <div className="flex flex-wrap gap-1">
                {compatibility.complementarySkills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={onViewDetails}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
          >
            View Details
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onStartChat}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
            >
              💬 Chat
            </button>
            <button 
              onClick={onScheduleMeeting}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
            >
              📅 Meet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Match Details Modal Component
 */
const MatchDetailsModal = ({ match, onClose, onStartChat, onScheduleMeeting }) => {
  const { profile, compatibility, details } = match;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-blue-100 text-lg">
                {profile?.professionalTitle}
              </p>
              <p className="text-blue-100">
                {profile?.company}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Bio */}
          {profile?.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}

          {/* Skills and Interests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Skills */}
            {match.preferences?.skills?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {match.preferences.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {match.preferences?.interests?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {match.preferences.interests.map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {compatibility && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Compatibility Analysis</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 mb-4">{compatibility.reasoning}</p>
                
                {compatibility.collaborationPotential && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-800">Collaboration Potential:</p>
                    <p className="text-gray-600">{compatibility.collaborationPotential}</p>
                  </div>
                )}

                {compatibility.networkingValue && (
                  <div>
                    <p className="font-medium text-gray-800">Networking Value:</p>
                    <p className="text-gray-600">{compatibility.networkingValue}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meeting Suggestions */}
          {details?.meetingSuggestions?.suggestions?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Meeting Suggestions</h3>
              <div className="space-y-3">
                {details.meetingSuggestions.suggestions.slice(0, 2).map((suggestion, idx) => (
                  <div key={idx} className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-medium text-purple-800 mb-2">{suggestion.title}</h4>
                    <p className="text-purple-700 text-sm mb-2">
                      {suggestion.format} • {suggestion.duration}
                    </p>
                    {suggestion.topics && (
                      <div className="flex flex-wrap gap-1">
                        {suggestion.topics.slice(0, 3).map((topic, topicIdx) => (
                          <span key={topicIdx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button 
              onClick={onStartChat}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors duration-200 font-medium"
            >
              💬 Start Chat
            </button>
            <button 
              onClick={onScheduleMeeting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-colors duration-200 font-medium"
            >
              📅 Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillMatchDashboard;
