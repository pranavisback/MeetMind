import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

const MeetingScheduler = ({ participants, onScheduleMeeting, onCancel }) => {
  const { showError } = useToast();
  const [step, setStep] = useState(1);
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 30,
    type: 'video', // video, audio, in-person
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isRecurring: false,
    recurrencePattern: 'weekly'
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  useEffect(() => {
    if (step === 2) {
      generateAiSuggestions();
      findAvailableSlots();
    }
  }, [step, meetingData]);

  const generateAiSuggestions = () => {
    // Simulate AI-generated meeting suggestions
    const suggestions = [
      {
        title: 'AI/ML Knowledge Share',
        description: 'Discuss recent developments in machine learning and potential collaboration opportunities.',
        duration: 45
      },
      {
        title: 'Product Strategy Discussion',
        description: 'Exchange insights on product development strategies and market trends.',
        duration: 30
      },
      {
        title: 'Tech Career Mentoring',
        description: 'Share experiences and advice on career growth in technology.',
        duration: 60
      }
    ];
    setAiSuggestions(suggestions);
  };

  const findAvailableSlots = async () => {
    setIsLoading(true);
    try {
      // Simulate Fetch.ai agent finding available slots
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const slots = [
        { date: '2025-07-07', time: '10:00', available: true },
        { date: '2025-07-07', time: '14:30', available: true },
        { date: '2025-07-07', time: '16:00', available: false },
        { date: '2025-07-08', time: '09:00', available: true },
        { date: '2025-07-08', time: '11:30', available: true },
        { date: '2025-07-08', time: '15:00', available: true },
        { date: '2025-07-09', time: '10:30', available: true },
        { date: '2025-07-09', time: '13:00', available: false },
        { date: '2025-07-09', time: '16:30', available: true },
      ];
      
      setAvailableSlots(slots.filter(slot => slot.available));
    } catch (error) {
      console.error('Error finding available slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setMeetingData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplySuggestion = (suggestion) => {
    setMeetingData(prev => ({
      ...prev,
      title: suggestion.title,
      description: suggestion.description,
      duration: suggestion.duration
    }));
  };

  const handleSchedule = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to schedule meeting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const scheduledMeeting = {
        ...meetingData,
        id: Date.now().toString(),
        participants,
        status: 'scheduled',
        createdAt: new Date()
      };
      
      onScheduleMeeting(scheduledMeeting);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      showError('Error scheduling meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
            <p className="text-gray-600 mt-1">
              AI-powered scheduling with {participants.map(p => p.name).join(', ')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mt-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            3
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Meeting Details</span>
          <span>Select Time</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">💡 AI Suggestions</h4>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      <span className="text-xs text-primary-600">{suggestion.duration} minutes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={meetingData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="input-field"
                  placeholder="e.g. AI/ML Knowledge Share"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={meetingData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="What would you like to discuss?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <select
                  value={meetingData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="input-field"
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Audio Call</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={meetingData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="input-field"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {meetingData.type === 'in-person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={meetingData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Conference Center, Lobby"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!meetingData.title}
                className="btn-primary"
              >
                Next: Select Time
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Fetch.ai agents are finding optimal meeting times...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleInputChange('date', slot.date);
                      handleInputChange('time', slot.time);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      meetingData.date === slot.date && meetingData.time === slot.time
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(slot.date)}
                    </div>
                    <div className="text-lg font-semibold text-primary-600">
                      {slot.time}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {meetingData.duration} min meeting
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!meetingData.date || !meetingData.time}
                className="btn-primary"
              >
                Next: Confirm
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Meeting</h3>
            
            <div className="card bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-4">{meetingData.title}</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {formatDate(meetingData.date)} at {meetingData.time}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{meetingData.duration} minutes</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{meetingData.type.replace('-', ' ')}</span>
                </div>
                
                {meetingData.type === 'in-person' && meetingData.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{meetingData.location}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">
                    {participants.map(p => p.name).join(', ')}
                  </span>
                </div>
              </div>
              
              {meetingData.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Description:</h5>
                  <p className="text-sm text-gray-600">{meetingData.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSchedule}
                disabled={isLoading}
                className="btn-primary min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Scheduling...
                  </>
                ) : (
                  'Schedule Meeting'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingScheduler;
