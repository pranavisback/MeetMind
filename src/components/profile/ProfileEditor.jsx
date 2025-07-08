import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../../contexts/ToastContext';
import ProfileForm from './ProfileForm';
import ProfileCard from './ProfileCard';

const ProfileEditor = ({ userId, onSave }) => {
  const { getToken } = useAuth();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    profile: {
      firstName: '',
      lastName: '',
      professionalTitle: '',
      company: '',
      location: {
        city: '',
        country: ''
      },
      bio: '',
      linkedIn: '',
      website: ''
    },
    preferences: {
      skills: [],
      interests: [],
      networkingGoals: [],
      meetingPreferences: {
        format: 'both',
        duration: '30min',
        timeZone: 'UTC'
      }
    }
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Load user profile from backend
    const loadProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = await getToken();
        const res = await fetch('/api/profile', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            // Profile doesn't exist yet, use empty form
            setProfile(null);
            return;
          }
          throw new Error('Failed to load profile');
        }
        
        const data = await res.json();
        setProfile(data.profile);
        
        // Update form data with loaded profile
        setFormData({
          profile: {
            firstName: data.profile.profile?.firstName || '',
            lastName: data.profile.profile?.lastName || '',
            professionalTitle: data.profile.profile?.professionalTitle || '',
            company: data.profile.profile?.company || '',
            location: {
              city: data.profile.profile?.location?.city || '',
              country: data.profile.profile?.location?.country || ''
            },
            bio: data.profile.profile?.bio || '',
            linkedIn: data.profile.profile?.linkedIn || '',
            website: data.profile.profile?.website || ''
          },
          preferences: {
            skills: data.profile.preferences?.skills || [],
            interests: data.profile.preferences?.interests || [],
            networkingGoals: data.profile.preferences?.networkingGoals || [],
            meetingPreferences: {
              format: data.profile.preferences?.meetingPreferences?.format || 'both',
              duration: data.profile.preferences?.meetingPreferences?.duration || '30min',
              timeZone: data.profile.preferences?.meetingPreferences?.timeZone || 'UTC'
            }
          }
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Error loading profile.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) loadProfile();
  }, [userId, getToken]);

  const handleSave = async (data) => {
    setIsSaving(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save profile');
      }
      
      const updated = await res.json();
      setProfile(updated.profile);
      setFormData(data);
      
      if (onSave) onSave(updated.profile);
      
      // Show success message
      showSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCompletionPercentage = () => {
    const requiredFields = [
      formData.profile.firstName,
      formData.profile.lastName,
      formData.profile.professionalTitle,
      formData.profile.bio,
      formData.preferences.skills.length > 0,
      formData.preferences.interests.length > 0,
      formData.preferences.networkingGoals.length > 0
    ];
    
    const completedFields = requiredFields.filter(Boolean).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-2">
              Update your information to help others connect with you
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`btn-secondary ${isPreviewMode ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </button>
          </div>
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {!isPreviewMode ? (
            <ProfileForm
              initialData={formData}
              onSubmit={handleSave}
              isLoading={isSaving}
            />
          ) : (
            <ProfileCard profile={formData} />
          )}
        </div>
        
        {/* Tips and Completion Status */}
        <div className="lg:col-span-1">
          {/* Completion Status */}
          <div className="p-6 bg-white rounded-2xl shadow-lg mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Profile Completion</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-bold text-gray-900">
                  {calculateCompletionPercentage()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculateCompletionPercentage()}%` }}
                ></div>
              </div>
              
              {/* Progress Items */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.profile.firstName && formData.profile.lastName ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.profile.firstName && formData.profile.lastName ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Basic Information</span>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.profile.professionalTitle ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.profile.professionalTitle ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Professional Title</span>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.profile.bio ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.profile.bio ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Bio</span>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.preferences.skills.length > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.preferences.skills.length > 0 ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Skills & Expertise</span>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.preferences.interests.length > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.preferences.interests.length > 0 ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Interests</span>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${formData.preferences.networkingGoals.length > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.preferences.networkingGoals.length > 0 ? '✓' : '○'}
                  </span>
                  <span className="text-gray-600">Networking Goals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Profile Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-3">
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>Add specific skills to improve AI matching accuracy</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>Include clear networking goals to attract relevant connections</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>Write a compelling bio that showcases your experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>Add professional links to make it easy to connect</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>Complete profile increases match quality by 80%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
