import { useState, useEffect } from 'react';
import MeetingScheduler from '../components/meeting/MeetingScheduler';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { meetingAPI } from '../utils/api';
import Loading from '../components/common/Loading';

const MeetingPage = () => {
  const { user, isSignedIn } = useAuthContext();
  const { showSuccess, showError } = useToast();
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn && user) {
      loadMeetings();
    }
  }, [isSignedIn, user]);

  const loadMeetings = async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await meetingAPI.getMeetings();
      
      if (response.data) {
        // Transform backend data to frontend format
        const transformedMeetings = response.data.map(meeting => ({
          id: meeting._id || meeting.id,
          title: meeting.title || 'Meeting',
          description: meeting.description || '',
          date: meeting.dateTime?.start ? new Date(meeting.dateTime.start).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: meeting.dateTime?.start ? new Date(meeting.dateTime.start).toTimeString().slice(0, 5) : '10:00',
          duration: meeting.duration || 30,
          type: meeting.type || 'video',
          location: meeting.location || '',
          participants: meeting.attendees?.map(attendee => ({
            id: attendee.user?._id || attendee.user,
            name: attendee.user?.profile ? 
              `${attendee.user.profile.firstName || ''} ${attendee.user.profile.lastName || ''}`.trim()
              : 'Unknown User',
            title: attendee.user?.profile?.title || 'Professional'
          })) || [],
          status: meeting.status || 'scheduled'
        }));

        setMeetings(transformedMeetings);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      setError('Failed to load meetings. Please try again.');
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeeting = async (meetingData) => {
    try {
      const response = await meetingAPI.scheduleMeeting(meetingData);
      if (response.data) {
        setShowScheduler(false);
        setSelectedParticipants([]);
        await loadMeetings(); // Refresh the meetings list
        showSuccess('Meeting scheduled successfully! Calendar invites will be sent shortly.');
      } else {
        showError('Failed to schedule meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      showError('Failed to schedule meeting. Please try again.');
    }
  };

  const handleStartScheduler = (participants = []) => {
    setSelectedParticipants(participants);
    setShowScheduler(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showScheduler) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <MeetingScheduler
          participants={selectedParticipants}
          onScheduleMeeting={handleScheduleMeeting}
          onCancel={() => setShowScheduler(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
              <p className="text-gray-600 mt-2">
                Manage your scheduled meetings and create new ones
              </p>
            </div>
            <button
              onClick={() => handleStartScheduler()}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Schedule New Meeting
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {meetings.filter(m => m.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {meetings.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {meetings.filter(m => new Date(m.date) >= new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {meetings.reduce((total, m) => total + m.duration, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Minutes</div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Meetings</h2>
          
          {meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="card hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{meeting.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700">
                            {formatDate(meeting.date)} at {meeting.time}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{meeting.duration} minutes</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {meeting.type === 'video' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                            {meeting.type === 'audio' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            )}
                            {meeting.type === 'in-person' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            )}
                          </svg>
                          <span className="text-gray-700 capitalize">
                            {meeting.type === 'in-person' ? meeting.location : meeting.type.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Participants:</span>
                        <div className="flex items-center space-x-2">
                          {meeting.participants.map((participant, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-700">{participant.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button className="btn-primary text-sm px-3 py-1">
                        Join Meeting
                      </button>
                      <button className="btn-secondary text-sm px-3 py-1">
                        Reschedule
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings scheduled</h3>
              <p className="text-gray-600 mb-4">
                Start by scheduling a meeting with your connections
              </p>
              <button
                onClick={() => handleStartScheduler()}
                className="btn-primary"
              >
                Schedule Your First Meeting
              </button>
            </div>
          )}
        </div>

        {/* AI Meeting Insights */}
        <div className="mt-12 card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🤖 Meeting Insights</h3>
              <p className="text-gray-700 mb-3">
                Our Fetch.ai agents have optimized your meeting schedule for maximum productivity.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tuesday 10 AM is your most productive meeting time</li>
                <li>• Consider 30-minute buffers between meetings</li>
                <li>• Video calls show 23% higher engagement than audio-only</li>
                <li>• Follow-up rate improves by 40% with shared agendas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;
