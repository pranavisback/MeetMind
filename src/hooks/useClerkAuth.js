import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '../utils/api';

/**
 * Custom hook to integrate Clerk authentication with our API
 */
export const useClerkAuth = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  // Set up the token getter for API calls
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (isSignedIn && getToken) {
        try {
          return await getToken();
        } catch (error) {
          console.error('Failed to get Clerk token:', error);
          return null;
        }
      }
      return null;
    });
  }, [isSignedIn, getToken]);

  // Helper function to get user data in our app format
  const getCurrentUser = () => {
    if (!user) return null;

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatar: user.imageUrl,
      emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  };

  return {
    isAuthenticated: isSignedIn,
    isLoaded,
    user: getCurrentUser(),
    clerkUser: user,
    getToken
  };
};

export default useClerkAuth;
