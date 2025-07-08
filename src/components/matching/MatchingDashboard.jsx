import { useState, useEffect } from 'react';
import MatchCard from './MatchCard';
import Loading from '../common/Loading';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { matchingAPI, formatLocation, chatAPI } from '../../utils/api';

const MatchingDashboard = () => {
  const { user, isSignedIn } = useAuthContext();
  const { showSuccess, showError } = useToast();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minMatchScore: 60,
    location: '',
    skills: [],
    interests: [],
    sortBy: 'matchScore'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      loadMatches();
    }
  }, [filters, isSignedIn, user]);

  const loadMatches = async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use enhanced matching API for Groq-powered recommendations
      const params = new URLSearchParams({
        limit: '20',
        minScore: filters.minMatchScore.toString()
      });

      if (filters.location) {
        params.append('location', filters.location);
      }

      const response = await matchingAPI.getEnhancedMatches(params.toString());
      
      if (response.success) {
        let processedMatches = response.matches.map(match => ({
          id: match.userId,
          profile: {
            id: match.clerkId,
            name: `${match.profile?.firstName || ''} ${match.profile?.lastName || ''}`.trim(),
            title: match.profile?.title || 'Professional',
            company: match.profile?.company || '',
            location: formatLocation(match.profile?.location),
            avatar: match.profile?.profilePicture || null,
            bio: match.profile?.bio || 'Professional seeking meaningful connections.'
          },
          matchScore: Math.round(match.matchScore),
          compatibilityReasons: match.compatibility?.reasons || ['Professional compatibility detected'],
          mutualConnections: match.compatibility?.mutualConnections || 0,
          sharedInterests: match.compatibility?.sharedInterests || [],
          sharedSkills: match.compatibility?.sharedSkills || [],
          reasoning: match.compatibility?.reasoning || 'AI-powered compatibility analysis'
        }));

        // Apply client-side filters
        if (filters.skills.length > 0) {
          processedMatches = processedMatches.filter(match =>
            match.sharedSkills.some(skill =>
              filters.skills.some(filterSkill =>
                skill.toLowerCase().includes(filterSkill.toLowerCase())
              )
            )
          );
        }

        if (filters.interests.length > 0) {
          processedMatches = processedMatches.filter(match =>
            match.sharedInterests.some(interest =>
              filters.interests.some(filterInterest =>
                interest.toLowerCase().includes(filterInterest.toLowerCase())
              )
            )
          );
        }

        // Sort matches
        processedMatches.sort((a, b) => {
          switch (filters.sortBy) {
            case 'matchScore':
              return b.matchScore - a.matchScore;
            case 'mutualConnections':
              return b.mutualConnections - a.mutualConnections;
            case 'name':
              return a.profile.name.localeCompare(b.profile.name);
            default:
              return b.matchScore - a.matchScore;
          }
        });

        setMatches(processedMatches);
      } else {
        setError(response.message || 'Failed to load matches');
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load matches. Please try again.');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await loadMatches();
    } catch (error) {
      console.error('Error refreshing matches:', error);
      setError('Failed to refresh matches. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      const response = await matchingAPI.sendConnectionRequest(userId, 'Hi! I would like to connect with you.');
      if (response.success) {
        showSuccess('Connection request sent successfully!');
      } else {
        showError('Failed to send connection request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      showError('Failed to send connection request. Please try again.');
    }
  };

  const handleMessage = async (userId) => {
    try {
      const chatRoom = await chatAPI.startChatWithUser(userId);
      
      if (chatRoom && chatRoom.id) {
        window.location.href = `/chat/${chatRoom.id}`;
      } else {
        showError('Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      showError('Failed to start chat. Please try again.');
    }
  };

  const handleViewProfile = (userId) => {
    // Navigate to user profile
    window.location.href = `/profile/${userId}`;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your matches.</p>
          <a href="/sign-in" className="btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  if (isLoading && matches.length === 0) {
    return <Loading text="Finding your perfect matches..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Matches</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Matches</h1>
            <p className="text-gray-600 mt-2">
              AI-powered recommendations based on your profile and preferences
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Matches
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Match Score
            </label>
            <select
              value={filters.minMatchScore}
              onChange={(e) => handleFilterChange('minMatchScore', parseInt(e.target.value))}
              className="input-field"
            >
              <option value={50}>50% or higher</option>
              <option value={60}>60% or higher</option>
              <option value={70}>70% or higher</option>
              <option value={80}>80% or higher</option>
              <option value={90}>90% or higher</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="input-field"
              placeholder="Filter by city or state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input-field"
            >
              <option value="matchScore">Match Score</option>
              <option value="mutualConnections">Mutual Connections</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                minMatchScore: 60,
                location: '',
                skills: [],
                interests: [],
                sortBy: 'matchScore'
              })}
              className="btn-secondary w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">{matches.length}</div>
          <div className="text-sm text-gray-600">Potential Matches</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {matches.filter(m => m.matchScore >= 80).length}
          </div>
          <div className="text-sm text-gray-600">High Quality Matches</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {matches.reduce((sum, m) => sum + m.mutualConnections, 0)}
          </div>
          <div className="text-sm text-gray-600">Mutual Connections</div>
        </div>
      </div>

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onConnect={handleConnect}
              onMessage={handleMessage}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or updating your profile to improve match quality.
          </p>
          <button onClick={handleRefresh} className="btn-primary">
            Refresh Matches
          </button>
        </div>
      )}

      {/* AI Insights */}
      <div className="mt-12 card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 AI Matching Insights</h3>
            <p className="text-gray-700 mb-3">
              Your profile shows strong expertise in technology and product development. 
              Consider adding more specific networking goals to attract mentors and collaborators.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your skills in React and AI/ML are highly sought after</li>
              <li>• Adding location preferences could improve local networking</li>
              <li>• Consider mentioning industry events you're interested in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingDashboard;
