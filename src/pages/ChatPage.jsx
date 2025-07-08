import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatInterface from '../components/chat/ChatInterface';
import { useAuth } from '@clerk/clerk-react';

const ChatPage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(chatId || null);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSelectChat = (newChatId, otherUser) => {
    setSelectedChatId(newChatId);
    setSelectedUser(otherUser);
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
        <ChatList
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          currentUserId={user?.id}
        />
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedChatId && selectedUser ? (
          <ChatInterface
            chatId={selectedChatId}
            currentUserId={user?.id}
            otherUser={selectedUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;