import { useState, useEffect, useRef, Fragment } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { chatAPI } from '../../utils/api';
import socketService from '../../utils/socket';

const ChatInterface = ({ chatId, currentUserId, otherUser }) => {
  const { showInfo, showError, showSuccess } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadMessages();
    joinChatRoom();
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
      leaveChatRoom();
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const joinChatRoom = () => {
    if (socketService.isConnected && chatId) {
      socketService.emit('join_chat', chatId);
    }
  };

  const leaveChatRoom = () => {
    if (socketService.isConnected && chatId) {
      socketService.emit('leave_chat', chatId);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleTypingIndicator);
    socketService.on('message_edited', handleMessageEdited);
    socketService.on('message_deleted', handleMessageDeleted);
  };

  const cleanupSocketListeners = () => {
    socketService.off('new_message', handleNewMessage);
    socketService.off('user_typing', handleTypingIndicator);
    socketService.off('message_edited', handleMessageEdited);
    socketService.off('message_deleted', handleMessageDeleted);
  };

  const handleNewMessage = (message) => {
    // Only add message if it doesn't already exist (prevent duplicates from API + socket)
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
    scrollToBottom();
  };

  const handleTypingIndicator = ({ userId, isTyping: typing }) => {
    if (userId !== currentUserId) {
      setIsTyping(typing);
    }
  };

  const handleMessageEdited = ({ messageId, content, editedAt }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isEdited: true, editedAt }
        : msg
    ));
  };

  const handleMessageDeleted = ({ messageId, deletedAt }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: '[Message deleted]', type: 'deleted', deletedAt }
        : msg
    ));
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await chatAPI.getMessages(chatId);
      console.log('Messages response:', response); // Debug log

      // Access the data from the response's data property (Axios)
      if (response && response.data && response.data.messages) {
        setMessages(response.data.messages || []);
      } else {
        console.error('Unexpected response structure:', response);
        showError('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await chatAPI.sendMessage(chatId, messageContent, 'text');
      console.log('Send message response:', response); // Debug log

      // The API returns { message: 'success', data: messageData } via Axios
      if (response && response.data && response.data.data) {
        showSuccess('Message sent');
        // Message will also be added via socket event, but let's add it immediately for better UX
        setMessages(prev => [...prev, response.data.data]);
      } else {
        showError('Failed to send message');
        setNewMessage(messageContent); // Restore message on failure
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
      setNewMessage(messageContent); // Restore message on failure
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socketService.emit('typing_start', {
      chatId,
      userId: currentUserId
    });

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('typing_stop', {
        chatId,
        userId: currentUserId
      });
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    if (msgDate.toDateString() === today) return 'Today';
    if (msgDate.toDateString() === yesterday) return 'Yesterday';
    return msgDate.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const scheduleMeeting = () => {
    showInfo('Meeting scheduling feature will be implemented with Fetch.ai agents!');
  };

  // Helper to group messages by sender and day
  const groupMessages = (messages) => {
    if (!messages.length) return [];
    const groups = [];
    let lastSender = null;
    let lastDate = null;
    let currentGroup = null;

    messages.forEach((msg, idx) => {
      const msgDate = new Date(msg.timestamp);
      const dayKey = msgDate.toDateString();
      const isNewDay = lastDate !== dayKey;
      const isNewSender = lastSender !== msg.senderId || isNewDay;

      if (isNewDay) {
        groups.push({ type: 'day', day: dayKey, key: `day-${idx}` });
        lastDate = dayKey;
      }
      if (isNewSender || !currentGroup) {
        currentGroup = {
          type: 'group',
          senderId: msg.senderId,
          sender: msg.sender,
          messages: [],
          key: `group-${msg.senderId}-${idx}`
        };
        groups.push(currentGroup);
        lastSender = msg.senderId;
      }
      currentGroup.messages.push(msg);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUser?.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                getInitials(otherUser?.name || 'User')
              )}
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser?.name || 'User'}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Online' : 'Last seen recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={scheduleMeeting}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
            title="Schedule Meeting"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages(messages).map((group) => {
          if (group.type === 'day') {
            return (
              <div key={group.key} className="flex justify-center my-6">
                <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                  {formatDay(group.day)}
                </span>
              </div>
            );
          }
          
          // Determine if this is the current user's message
          const isMe = group.senderId === currentUserId;
          
          console.log('🔍 Message alignment - senderId:', group.senderId, 'currentUserId:', currentUserId, 'isMe:', isMe);
          
          return (
            <div key={group.key} className="flex w-full mb-4">
              {/* Left spacer for my messages */}
              {isMe && <div className="flex-1"></div>}
              
              {/* Message container */}
              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end mr-4' : 'items-start ml-4'}`}>
                {/* Sender info */}
                <div className={`flex items-center mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isMe ? 'bg-blue-500 text-white ml-2' : 'bg-gray-400 text-white mr-2'
                  }`}>
                    {isMe ? 'Y' : 'U'}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {isMe ? 'You' : (group.sender?.name || 'User')}
                  </span>
                </div>
                
                {/* Messages */}
                <div className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {group.messages.map((msg) => (
                    <div key={msg.id}>
                      <div className={`px-4 py-2 rounded-2xl shadow-sm break-words ${
                        isMe
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                      }`}>
                        {msg.content}
                      </div>
                      <span className={`text-xs text-gray-400 mt-1 block ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right spacer for other user messages */}
              {!isMe && <div className="flex-1"></div>}
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start mb-4">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white mr-2">
              {getInitials(otherUser?.name || 'User')}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-2xl transition-all duration-200 ${
              newMessage.trim() && !isSending
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
