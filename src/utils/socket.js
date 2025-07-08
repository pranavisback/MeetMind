import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.eventHandlers = new Map();
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketURL, {
      transports: ['websocket'],
      upgrade: true,
    });

    this.userId = userId;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      
      // Join user's personal room for notifications
      if (this.userId) {
        this.socket.emit('join', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up default event handlers
    this.setupDefaultHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.eventHandlers.clear();
    }
  }

  setupDefaultHandlers() {
    // Connection request notifications
    this.socket.on('connection_request', (data) => {
      this.emit('connectionRequest', data);
    });

    // Connection response notifications
    this.socket.on('connection_response', (data) => {
      this.emit('connectionResponse', data);
    });

    // Meeting invitation notifications
    this.socket.on('meeting_invitation', (data) => {
      this.emit('meetingInvitation', data);
    });

    // Meeting response notifications
    this.socket.on('meeting_response', (data) => {
      this.emit('meetingResponse', data);
    });

    // Meeting updated notifications
    this.socket.on('meeting_updated', (data) => {
      this.emit('meetingUpdated', data);
    });

    // Meeting cancelled notifications
    this.socket.on('meeting_cancelled', (data) => {
      this.emit('meetingCancelled', data);
    });

    // Chat message notifications
    this.socket.on('receive_message', (data) => {
      this.emit('receiveMessage', data);
    });

    // New message notifications
    this.socket.on('new_message', (data) => {
      this.emit('newMessage', data);
    });

    // Message edited notifications
    this.socket.on('message_edited', (data) => {
      this.emit('messageEdited', data);
    });

    // Message deleted notifications
    this.socket.on('message_deleted', (data) => {
      this.emit('messageDeleted', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('userTyping', data);
    });
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', chatId);
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Send a message to a chat room
  sendMessage(chatId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        chatId,
        ...message,
        userId: this.userId
      });
    }
  }

  // Send typing indicator
  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', {
        chatId,
        userId: this.userId
      });
    }
  }

  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', {
        chatId,
        userId: this.userId
      });
    }
  }

  // Event handler management
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
