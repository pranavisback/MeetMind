import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { matchingAPI, meetingAPI, profileAPI, formatLocation, chatAPI } from '../utils/api';
import ProfileCard from '../components/profile/ProfileCard';
import MatchCard from '../components/matching/MatchCard';
import Loading from '../components/common/Loading';

const Dashboard = () => {
  const { user, profile, isSignedIn } = useAuthContext();
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState({});
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [skillMatchProfile, setSkillMatchProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn && user) {
      loadDashboardData();
    }
  }, [isSignedIn, user]);

  const loadDashboardData = async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load data in parallel
      const [matchesResponse, meetingsResponse, profileResponse, skillMatchResponse] = await Promise.allSettled([
        matchingAPI.getEnhancedMatches('limit=5&minScore=70'),
        meetingAPI.getMeetings('upcoming=true'),
        profileAPI.getProfile(),
        profileAPI.getSkillMatchProfile()
      ]);

      // Process matches
      if (matchesResponse.status === 'fulfilled' && matchesResponse.value?.success) {
        const matches = matchesResponse.value.matches.slice(0, 3).map(match => ({
          id: match.userId,
          profile: {
            id: match.clerkId,
            name: `${match.profile?.firstName || ''} ${match.profile?.lastName || ''}`.trim(),
            title: match.profile?.title || 'Professional',
            company: match.profile?.company || '',
            location: formatLocation(match.profile?.location),
            avatar: match.profile?.profilePicture || null
          },
          matchScore: Math.round(match.matchScore),
          compatibilityReasons: match.compatibility?.reasons?.slice(0, 2) || ['Professional compatibility'],
          mutualConnections: match.compatibility?.mutualConnections || 0,
          sharedInterests: match.compatibility?.sharedInterests?.slice(0, 3) || [],
          reasoning: match.compatibility?.reasoning || 'AI-powered match'
        }));
        setRecentMatches(matches);
      } else {
        setRecentMatches([]);
      }

      // Process meetings - handle different response structures
      let meetings = [];
      if (meetingsResponse.status === 'fulfilled' && meetingsResponse.value) {
        const meetingsData = meetingsResponse.value.data || meetingsResponse.value;
        
        if (Array.isArray(meetingsData)) {
          meetings = meetingsData.slice(0, 3).map(meeting => ({
            id: meeting._id || meeting.id,
            title: meeting.title || 'Meeting',
            date: meeting.dateTime?.start ? new Date(meeting.dateTime.start).toLocaleDateString() : 'TBD',
            time: meeting.dateTime?.start ? new Date(meeting.dateTime.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD',
            participants: meeting.attendees?.map(attendee => 
              attendee.user?.profile ? 
                `${attendee.user.profile.firstName || ''} ${attendee.user.profile.lastName || ''}`.trim() 
                : 'Unknown User'
            ) || [],
            type: meeting.type || 'video'
          }));
        }
      }
      setUpcomingMeetings(meetings);

      // Process profile data
      if (profileResponse.status === 'fulfilled' && profileResponse.value?.profile) {
        console.log('✅ User profile loaded:', profileResponse.value.profile);
        setUserProfile(profileResponse.value.profile);
      } else {
        console.log('❌ User profile failed:', profileResponse.reason?.message || 'No profile data');
      }

      // Process skillmatch profile data
      if (skillMatchResponse.status === 'fulfilled' && skillMatchResponse.value?.skillMatchProfile) {
        console.log('✅ SkillMatch profile loaded:', skillMatchResponse.value.skillMatchProfile);
        setSkillMatchProfile(skillMatchResponse.value.skillMatchProfile);
      } else if (skillMatchResponse.status === 'rejected') {
        console.log('❌ SkillMatch profile error:', skillMatchResponse.reason?.message);
        // This is expected for new users who haven't completed their profile yet
      }

      // Calculate stats from available data
      setStats({
        totalConnections: 0, // Will be updated when connections API is available
        newMatches: recentMatches.length,
        upcomingMeetings: meetings.length,
        profileViews: 0 // Will be updated when analytics API is available
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set empty states
      setStats({
        totalConnections: 0,
        newMatches: 0,
        upcomingMeetings: 0,
        profileViews: 0
      });
      setRecentMatches([]);
      setUpcomingMeetings([]);
    } finally {
      setIsLoading(false);
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
    window.location.href = `/profile/${userId}`;
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your dashboard.</p>
          <a href="/sign-in" className="btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading text="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={loadDashboardData}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || profile?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your networking activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalConnections}</div>
            <div className="text-sm text-gray-600">Total Connections</div>
            <div className="text-xs text-green-600 mt-1">+3 this week</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.newMatches}</div>
            <div className="text-sm text-gray-600">New Matches</div>
            <div className="text-xs text-green-600 mt-1">Updated daily</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.upcomingMeetings}</div>
            <div className="text-sm text-gray-600">Upcoming Meetings</div>
            <div className="text-xs text-blue-600 mt-1">Next: Tomorrow</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.profileViews}</div>
            <div className="text-sm text-gray-600">Profile Views</div>
            <div className="text-xs text-green-600 mt-1">+12 this week</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/matching" className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Find Matches</div>
                    <div className="text-sm text-gray-600">Discover new connections</div>
                  </div>
                </Link>

                <Link to="/chat" className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Messages</div>
                    <div className="text-sm text-gray-600">Chat with connections</div>
                  </div>
                </Link>

                <Link to="/profile" className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Edit Profile</div>
                    <div className="text-sm text-gray-600">Update your information</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Matches */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Matches</h2>
                <Link to="/matching" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-6">
                {recentMatches.length > 0 ? (
                  recentMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onConnect={handleConnect}
                      onMessage={handleMessage}
                      onViewProfile={handleViewProfile}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matches yet</h3>
                    <p className="text-gray-600 mb-4">Complete your profile to get AI-powered matches</p>
                    <Link to="/matching" className="btn-primary">Find Matches</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
              {isLoading ? (
                <div className="card">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Create profile data for ProfileCard */}
                  {(() => {
                    // Helper function to extract skills from different sources
                    const getSkills = () => {
                      // From enhanced skillmatch profile
                      if (skillMatchProfile?.skills?.technical?.length > 0) {
                        return skillMatchProfile.skills.technical.map(s => s.name);
                      }
                      // From basic user profile
                      if (userProfile?.preferences?.skills?.length > 0) {
                        return userProfile.preferences.skills;
                      }
                      return [];
                    };

                    // Helper function to extract interests from different sources
                    const getInterests = () => {
                      // From enhanced skillmatch profile
                      if (skillMatchProfile?.interests?.professional?.length > 0) {
                        return skillMatchProfile.interests.professional;
                      }
                      // From basic user profile
                      if (userProfile?.preferences?.interests?.length > 0) {
                        return userProfile.preferences.interests;
                      }
                      return [];
                    };

                    // Helper function to get user name
                    const getName = () => {
                      if (skillMatchProfile?.profile?.firstName && skillMatchProfile?.profile?.lastName) {
                        return `${skillMatchProfile.profile.firstName} ${skillMatchProfile.profile.lastName}`;
                      }
                      if (userProfile?.profile?.firstName && userProfile?.profile?.lastName) {
                        return `${userProfile.profile.firstName} ${userProfile.profile.lastName}`;
                      }
                      return user?.fullName || user?.firstName || 'User';
                    };

                    // Helper function to get location
                    const getLocation = () => {
                      // First try skillMatchProfile location
                      if (skillMatchProfile?.profile?.location?.city && skillMatchProfile?.profile?.location?.country) {
                        return `${skillMatchProfile.profile.location.city}, ${skillMatchProfile.profile.location.country}`;
                      }
                      
                      // Then try userProfile location with formatLocation utility
                      return formatLocation(userProfile?.profile?.location);
                    };

                    const profileData = {
                      id: userProfile?.clerkId || user?.id,
                      name: getName(),
                      title: skillMatchProfile?.profile?.professionalTitle || 
                             userProfile?.profile?.jobTitle || 
                             'Professional',
                      company: skillMatchProfile?.profile?.company || 
                              userProfile?.profile?.company || 
                              '',
                      location: getLocation(),
                      bio: skillMatchProfile?.profile?.bio || 
                           userProfile?.profile?.bio || 
                           '',
                      avatar: skillMatchProfile?.profile?.avatar || 
                             userProfile?.profile?.avatar || 
                             user?.imageUrl || 
                             null,
                      skills: getSkills(),
                      interests: getInterests(),
                      email: skillMatchProfile?.profile?.email || 
                             userProfile?.email || 
                             user?.primaryEmailAddress?.emailAddress
                    };

                    console.log('📊 Dashboard Profile Summary:', {
                      hasSkillMatchProfile: !!skillMatchProfile,
                      hasUserProfile: !!userProfile,
                      skillsCount: profileData.skills.length,
                      interestsCount: profileData.interests.length,
                      profileCompleteness: skillMatchProfile?.matchingMetadata?.profileCompleteness || 0
                    });

                    return (
                      <>
                        <ProfileCard
                          profile={profileData}
                          isCurrentUser={true}
                          onConnect={handleConnect}
                          onMessage={() => {}}
                          onViewProfile={() => {}}
                        />
                        
                        {/* Profile Completion Prompt */}
                        {(profileData.skills.length === 0 || profileData.interests.length === 0) && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex">
                              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-blue-800">Complete Your Profile</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                  Add your skills and interests to get AI-powered matches and connect with like-minded professionals.
                                </p>
                                <div className="mt-3">
                                  <Link
                                    to="/profile"
                                    className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 border border-transparent rounded-md transition-colors duration-200"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Update Profile
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Upcoming Meetings */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
                <Link to="/meeting" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
                        <p className="text-sm text-gray-500">
                          {meeting.date} at {meeting.time}
                        </p>
                        <p className="text-xs text-gray-400">
                          {meeting.participants.length > 0 ? `with ${meeting.participants.join(', ')}` : 'No participants yet'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-3">No meetings scheduled</p>
                    <Link to="/meeting" className="text-xs text-primary-600 hover:text-primary-700">Schedule a meeting</Link>
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 AI Insights</h3>
              <div className="space-y-3 text-sm">
                {skillMatchProfile ? (
                  <>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        Your profile completeness is {skillMatchProfile.matchingMetadata?.profileCompleteness || 0}%. 
                        {skillMatchProfile.matchingMetadata?.profileCompleteness < 80 && (
                          <> Adding more skills and networking goals could increase matches by 20%.</>
                        )}
                        {skillMatchProfile.matchingMetadata?.profileCompleteness >= 80 && (
                          <> Your detailed profile helps generate better matches! 🎯</>
                        )}
                      </p>
                    </div>
                    {skillMatchProfile.skills?.technical?.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700">
                          Your top skills ({skillMatchProfile.skills.technical.slice(0, 2).map(s => s.name).join(', ')}) 
                          are in high demand. You're likely to find great matches!
                        </p>
                      </div>
                    )}
                    {recentMatches.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700">
                          You have {recentMatches.length} new high-quality matches. 
                          Consider reaching out to start meaningful conversations.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        Complete your profile to unlock personalized AI insights and better matches.
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        Add your skills, interests, and networking goals to get started.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Completeness */}
            {skillMatchProfile && (
              <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Profile Completeness</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {skillMatchProfile.matchingMetadata?.profileCompleteness || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${skillMatchProfile.matchingMetadata?.profileCompleteness || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {skillMatchProfile.matchingMetadata?.profileCompleteness < 100 ? (
                      <>Complete your profile to get better matches. <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium">Edit profile →</Link></>
                    ) : (
                      'Your profile is complete! 🎉'
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
