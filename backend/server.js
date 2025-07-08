const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Debug environment loading
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('.env path:', path.join(__dirname, '.env'));
console.log('File exists?:', require('fs').existsSync(path.join(__dirname, '.env')));

require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('FETCHAI')));
console.log('FETCHAI_API_KEY exists:', !!process.env.FETCHAI_API_KEY);

// Database connection
const database = require('./utils/database');

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchingRoutes = require('./routes/matching');
const enhancedMatchingRoutes = require('./routes/enhancedMatching');
const chatRoutes = require('./routes/chat');
const meetingRoutes = require('./routes/meeting');
const enhancedMeetingRoutes = require('./routes/enhancedMeeting');
const webhookRoutes = require('./routes/webhook');

// Import middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.IO setup for real-time chat
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/matching', authMiddleware, matchingRoutes);
app.use('/api/matching', authMiddleware, enhancedMatchingRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/meeting', authMiddleware, meetingRoutes);
app.use('/api/meetings', authMiddleware, enhancedMeetingRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint for API
app.get('/', (req, res) => {
  res.status(200).send('MeetMind API is running 🚀');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    // Broadcast message to all users in the chat room
    socket.to(`chat_${data.chatId}`).emit('receive_message', data);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', { 
      userId: data.userId, 
      isTyping: true 
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', { 
      userId: data.userId, 
      isTyping: false 
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to MongoDB
  try {
    await database.connect();
    console.log('📊 Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit in development, fallback to file system
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
});

module.exports = { app, server, io };
