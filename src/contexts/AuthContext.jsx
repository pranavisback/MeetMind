import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { profileAPI, setAuthTokenGetter } from '../utils/api';
import socketService from '../utils/socket';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isSignedIn, user, isLoaded, getToken } = useUser();
  const { signOut } = useAuth();

  // Set the token getter for API utility
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          console.log('Retrieved token:', token);
          return token;
        } catch (error) {
          console.error('Error retrieving token:', error);
          return null;
        }
      }
      return null;
    });
  }, [isSignedIn, getToken]);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync Clerk user with our profile system
  useEffect(() => {
    const syncUserProfile = async () => {
      if (!isLoaded) return;
      
      setLoading(true);
      setError(null);

      try {
        if (isSignedIn && user) {
          // Try to get existing profile
          try {
            const response = await profileAPI.getProfile();
            setProfile(response.data);
          } catch (profileError) {
            // If profile doesn't exist, create one from Clerk data
            if (profileError.response?.status === 404) {
              const newProfile = {
                profile: {
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  email: user.primaryEmailAddress?.emailAddress || '',
                  avatar: user.imageUrl || '',
                  bio: '',
                  jobTitle: '',
                  company: '',
                  location: '',
                  linkedIn: '',
                  website: ''
                },
                preferences: {
                  skills: [],
                  interests: [],
                  goals: [],
                  meetingPreferences: {
                    format: 'both',
                    duration: '30min',
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                  }
                }
              };

              const createResponse = await profileAPI.updateProfile(newProfile);
              setProfile(createResponse.data);
            } else {
              throw profileError;
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth sync error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUserProfile();
  }, [isSignedIn, user, isLoaded]);

  // Handle socket connection when user is authenticated
  useEffect(() => {
    if (isSignedIn && user && profile) {
      // Connect to socket with user ID
      socketService.connect(user.id);
    } else {
      // Disconnect when user is not authenticated
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isSignedIn, user, profile]);

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await profileAPI.updateProfile(profileData);
      setProfile(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  const value = {
    // Clerk user data
    isSignedIn,
    user,
    isLoaded,
    
    // Profile data
    profile,
    
    // Loading states
    loading: loading || !isLoaded,
    error,
    
    // Actions
    updateProfile,
    logout,
    
    // Utilities
    isAuthenticated: isSignedIn && !!profile,
    getUserId: () => user?.id,
    getAuthToken: async () => {
      if (!user) return null;
      try {
        return await user.getToken();
      } catch (err) {
        console.error('Token retrieval error:', err);
        return null;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
