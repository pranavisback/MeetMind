import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { chatAPI } from '../../utils/api';

const ChatList = ({ selectedChatId, onSelectChat, currentUserId }) => {
  const { user, isSignedIn } = useAuthContext();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isSignedIn && user) {
      loadChats();
    }
  }, [isSignedIn, user]);

  const loadChats = async () => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.getChatRooms();
      
      // Handle different response structures
      let chatsData = [];
      if (response?.data) {
        // Check if response.data is an array or has a chats property
        if (Array.isArray(response.data)) {
          chatsData = response.data;
        } else if (response.data.chats && Array.isArray(response.data.chats)) {
          chatsData = response.data.chats;
        } else if (response.data.rooms && Array.isArray(response.data.rooms)) {
          chatsData = response.data.rooms;
        }
      }

      console.log('Raw chats data received:', chatsData);

      if (chatsData.length > 0) {
        try {
          // Transform backend data to frontend format
          const transformedChats = chatsData.map(chat => {
            console.log('Processing chat:', chat.id, 'lastMessage:', chat.lastMessage);
            return {
            id: chat.id || chat._id,
          otherUser: {
            id: chat.participants?.[0]?.id || chat.participants?.[0]?.user?._id || 'unknown',
            name: chat.participants?.[0] ? 
              `${chat.participants[0].firstName || chat.participants[0].user?.profile?.firstName || ''} ${chat.participants[0].lastName || chat.participants[0].user?.profile?.lastName || ''}`.trim() 
              : 'Unknown User',
            title: chat.participants?.[0]?.title || chat.participants?.[0]?.user?.profile?.title || 'Professional',
            avatar: chat.participants?.[0]?.profilePicture || chat.participants?.[0]?.user?.profile?.profilePicture || null,
            isOnline: chat.participants?.[0]?.isOnline || false,
            lastSeen: chat.participants?.[0]?.lastSeen || null
          },
          lastMessage: chat.lastMessage ? {
            content: chat.lastMessage.content || 'No message',
            timestamp: chat.lastMessage.timestamp ? new Date(chat.lastMessage.timestamp) : new Date(),
            senderId: chat.lastMessage.senderId
          } : null,
          unreadCount: chat.unreadCount || 0,
          isPinned: chat.isPinned || false,
          updatedAt: new Date(chat.updatedAt || Date.now())
        };
        });

        // Sort by last message timestamp
        transformedChats.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp || a.updatedAt;
          const bTime = b.lastMessage?.timestamp || b.updatedAt;
          return new Date(bTime) - new Date(aTime);
        });

        setChats(transformedChats);
        } catch (transformError) {
          console.error('Error transforming chat data:', transformError);
          setChats([]);
        }
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chats. Please try again.');
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = chat.otherUser.name.toLowerCase().includes(searchLower);
    const messageMatch = chat.lastMessage?.content?.toLowerCase().includes(searchLower);
    
    return nameMatch || messageMatch;
  });

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor((now - messageDate) / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center text-red-700">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id, chat.otherUser)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                  selectedChatId === chat.id ? 'bg-primary-50 border-r-4 border-r-primary-600' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar with online status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {chat.otherUser.avatar ? (
                        <img 
                          src={chat.otherUser.avatar} 
                          alt={chat.otherUser.name} 
                          className="w-12 h-12 rounded-full object-cover" 
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {chat.otherUser.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Chat info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {chat.otherUser.name}
                        </h4>
                        {chat.isPinned && (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {chat.lastMessage?.timestamp ? formatTimestamp(chat.lastMessage.timestamp) : 'No messages'}
                        </span>
                        {chat.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1 truncate">
                      {chat.otherUser.title}
                    </p>
                    
                    <div className="flex items-center space-x-1">
                      {chat.lastMessage && chat.lastMessage.senderId === currentUserId && (
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      <p className={`text-sm truncate ${
                        chat.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {chat.lastMessage ? truncateMessage(chat.lastMessage.content) : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Start a conversation by connecting with other attendees'}
            </p>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Conversation
        </button>
      </div>
    </div>
  );
};

export default ChatList;
