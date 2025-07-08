import axios from 'axios';

// Utility function to safely format location objects to strings
export const formatLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') {
    return location.trim() || 'Location not specified';
  }
  
  if (typeof location === 'object') {
    const city = location.city || '';
    const country = location.country || '';
    const locationStr = `${city}, ${country}`.replace(/^,\s*|,\s*$/g, '').trim();
    return locationStr || 'Location not specified';
  }
  
  return 'Location not specified';
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global auth token setter for Clerk integration
let getAuthToken = null;

export const setAuthTokenGetter = (tokenGetter) => {
  getAuthToken = tokenGetter;
};

// Request interceptor to add Clerk auth token
api.interceptors.request.use(
  async (config) => {
    if (getAuthToken) {
      try {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - Clerk will handle this
      console.warn('Authentication error - redirecting to sign in');
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Auth API calls (updated for Clerk)
export const authAPI = {
  // Clerk handles authentication, but we keep these for profile management
  getCurrentUser: () => api.get('/auth/me'),
  syncProfile: (userData) => api.post('/auth/sync', userData),
};

// Profile API calls
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
  getPublicProfile: (userId) => api.get(`/profile/${userId}`),
  getSkillMatchProfile: () => api.get('/profile/skillmatch'),
  searchProfiles: (query, type = 'all', limit = 20) => 
    api.get('/profile/search', { params: { q: query, type, limit } }),
  uploadProfilePicture: (imageData) => 
    api.post('/profile/upload-picture', { imageData }),
};

// Matching API calls
export const matchingAPI = {
  getMatches: (limit = 10, minScore = 0.6) => 
    api.get('/matching/matches', { params: { limit, minScore } }),
  getEnhancedMatches: (params) => 
    api.get(`/matching/enhanced?${params}`).then(res => res.data),
  analyzeMatch: (targetUserId) => api.get(`/matching/analyze/${targetUserId}`),
  getMeetingSuggestions: (userIds) => api.post('/matching/meeting-suggestions', { userIds }),
  getConversationInsights: (messages) => api.post('/matching/conversation-insights', { messages }),
  sendConnectionRequest: (targetUserId, message) => 
    api.post('/matching/connect', { targetUserId, message }),
  respondToConnection: (connectionId, action) => 
    api.put(`/matching/connect/${connectionId}`, { action }),
  respondToMatch: (targetUserId, action) => 
    api.post('/matching/respond', { targetUserId, action }),
  getConnections: (status = 'all') => 
    api.get('/matching/connections', { params: { status } }),
  getMatchingStats: () => api.get('/matching/stats'),
};

// Chat API calls
export const chatAPI = {
  getChatRooms: () => api.get('/chat/rooms'),
  getMessages: (chatId, limit = 50, offset = 0) => 
    api.get(`/chat/${chatId}/messages`, { params: { limit, offset } }),
  sendMessage: (chatId, content, type = 'text', metadata = {}) => 
    api.post(`/chat/${chatId}/messages`, { content, type, metadata }),
  markAsRead: (chatId, messageIds = null) => 
    api.put(`/chat/${chatId}/read`, { messageIds }),
  editMessage: (messageId, content) => 
    api.put(`/chat/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  createChatRoom: (participantIds, type = 'direct', name = null) => 
    api.post('/chat/rooms', { participantIds, type, name }),
  startChatWithUser: async (userId) => {
    try {
      // Try to create a new chat room
      const response = await api.post('/chat/rooms', { 
        participantIds: [userId], 
        type: 'direct' 
      });
      return response.data;
    } catch (error) {
      // If we get any error, try to find existing chat rooms
      const roomsResponse = await api.get('/chat/rooms');
      const existingChat = roomsResponse.data.find(chat => 
        chat.type === 'direct' && 
        chat.participants.some(p => p.id === userId)
      );
      if (existingChat) {
        return existingChat;
      }
      throw error;
    }
  }
};

// Meeting API calls
export const meetingAPI = {
  getMeetings: (status = 'all', upcoming = false) => 
    api.get('/meeting/meetings', { params: { status, upcoming } }),
  createMeeting: (meetingData) => api.post('/meeting/meetings', meetingData),
  scheduleWithAI: (meetingData) => api.post('/meeting/schedule-ai', meetingData),
  optimizeMeeting: (meetingId) => api.post('/meeting/optimize', { meetingId }),
  respondToMeeting: (meetingId, response) => 
    api.put(`/meeting/meetings/${meetingId}/respond`, { response }),
  updateMeeting: (meetingId, updates) => 
    api.put(`/meeting/meetings/${meetingId}`, updates),
  cancelMeeting: (meetingId) => api.delete(`/meeting/meetings/${meetingId}`),
  getAvailability: (participantIds, duration = 60, startDate, endDate) => 
    api.get('/meeting/availability', { 
      params: { 
        participantIds: participantIds.join(','), 
        duration, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      } 
    }),
};

// Generic API error handler
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || 'An error occurred';
    return { error: message, status: error.response.status };
  } else if (error.request) {
    // Request made but no response received
    return { error: 'Network error. Please check your connection.', status: 0 };
  } else {
    // Something else happened
    return { error: error.message || 'An unexpected error occurred', status: -1 };
  }
};

export { getAuthToken };
export default api;
