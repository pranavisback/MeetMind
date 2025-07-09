# 🧠 MeetMind - AI-Powered Event Attendee Matching Engine


[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/AI-Groq_Llama-FF6B6B?style=flat-square)](https://groq.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.dev/)
[![Fetch.ai](https://img.shields.io/badge/AI-Fetch.ai-FF6B6B?style=flat-square&logo=fetch.ai)](https://fetch.ai/)

> **Transform networking events into meaningful connections with AI-powered attendee matching, real-time communication, and intelligent meeting scheduling.**

## 🌟 Overview

MeetMind is a comprehensive AI-powered platform that revolutionizes networking at events by intelligently matching attendees based on skills, interests, and networking goals. Using advanced AI algorithms powered by Groq's Llama models, the platform facilitates meaningful connections and automates meeting coordination.

## 🚀 Live Demo

**[🌐 Try MeetMind Live](https://pranavisback.github.io/MeetMind/)**

Experience the platform in action! Create your profile, explore AI-powered matching, and connect with other attendees.


### ✨ Key Features

- **🤖 AI-Powered Matching**: Advanced skill and interest compatibility analysis using Groq Llama models
- **👤 Smart Profile Management**: Comprehensive user profiles with skills, interests, and networking goals
- **💬 Real-Time Communication**: Instant messaging with typing indicators and connection status
- **📅 Intelligent Meeting Scheduling**: AI-suggested meeting topics and automated coordination via Fetch.ai agents
- **🔐 Secure Authentication**: Seamless user management with Clerk integration
- **📊 Analytics Dashboard**: Track connections, meeting success, and engagement metrics
- **🎨 Modern UI/UX**: Beautiful, responsive design with Tailwind CSS and toast notifications

## 🏗️ Architecture

### Frontend Stack
- **React 18+** with functional components and hooks
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Socket.IO Client** for real-time communication
- **Clerk React** for authentication flows

### Backend Stack
- **Node.js & Express** RESTful API server
- **MongoDB Atlas** cloud database with optimized schemas
- **Socket.IO** WebSocket server for real-time features
- **Clerk SDK** for secure authentication
- **Groq API** for AI-powered matching algorithms
- **Fetch.ai** integration for autonomous meeting agents

### AI & Automation
- **Groq Llama Models** for compatibility analysis and matching
- **Enhanced Matching Algorithms** with detailed reasoning
- **Fetch.ai Agents** for automated meeting scheduling
- **Smart Suggestion Systems** for skills, interests, and goals

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- MongoDB Atlas account
- Clerk account for authentication
- Groq API key
- Fetch.ai API key (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/meetmind.git
cd meetmind
```

2. **Install dependencies**
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

3. **Environment Configuration**

Create `.env` file in the backend directory:
```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=meetmind

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# AI Services
GROQ_API_KEY=gsk_your_groq_key_here
FETCHAI_API_KEY=sk_your_fetchai_key_here
```

4. **Start the application**
```bash
# Start backend server (Terminal 1)
cd backend
npm run dev

# Start frontend development server (Terminal 2)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Using VS Code Tasks
You can use the provided VS Code tasks for easier development:
- `Start Frontend (React)` - Launches the Vite development server
- `Start Backend (Express)` - Starts the Express API server
- `Install Frontend Dependencies` - Installs frontend packages
- `Install Backend Dependencies` - Installs backend packages

## 📁 Project Structure

```
meetmind/
├── 📁 src/                          # Frontend React application
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 chat/                # Real-time messaging components
│   │   ├── 📁 common/              # Shared components (Header, Footer, Loading)
│   │   ├── 📁 matching/            # AI matching dashboard and cards
│   │   ├── 📁 meeting/             # Meeting scheduling interfaces
│   │   └── 📁 profile/             # Profile management components
│   ├── 📁 contexts/                # React Context providers
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 pages/                   # Page-level components
│   └── 📁 utils/                   # Utility functions and API clients
├── 📁 backend/                     # Express.js API server
│   ├── 📁 routes/                  # API endpoint handlers
│   ├── 📁 services/                # Business logic and AI integrations
│   ├── 📁 models/                  # Database schemas and models
│   ├── 📁 middleware/              # Authentication and validation
│   ├── 📁 utils/                   # Backend utilities and helpers
│   └── 📁 data/                    # Development data storage
├── 📁 public/                      # Static assets
└── 📄 Configuration files          # Vite, Tailwind, ESLint configs
```

## 🔧 Core Features

### 1. Enhanced Profile Management
- **Comprehensive User Profiles**: Professional title, company, location, bio, skills, interests
- **Smart Suggestion System**: Curated lists of popular skills, interests, and networking goals
- **Progressive Profile Building**: Guided completion with progress tracking
- **Flexible Data Storage**: Dual collection system (users + skillmatch) for enhanced features

### 2. AI-Powered Matching Engine
- **Groq Llama Integration**: Advanced natural language processing for compatibility analysis
- **Multi-Factor Matching**: Skills, interests, networking goals, and professional background
- **Detailed Match Explanations**: AI-generated reasoning for each connection suggestion
- **Scoring Algorithm**: 0-100% compatibility scores with detailed breakdowns
- **Smart Meeting Topics**: AI-suggested conversation starters and agenda items

### 3. Real-Time Communication
- **Socket.IO Integration**: Persistent WebSocket connections for instant messaging
- **Modern Chat Interface**: Message bubbles, typing indicators, day separators
- **User Presence**: Online/offline status and connection indicators
- **Message History**: Persistent chat storage with MongoDB

### 4. Intelligent Meeting Scheduling
- **AI-Suggested Topics**: Context-aware meeting agenda generation
- **Flexible Scheduling**: Multiple time formats and timezone support
- **Fetch.ai Integration**: Autonomous agent coordination for meeting automation
- **Meeting Management**: Full CRUD operations with status tracking

### 5. Beautiful User Experience
- **Modern Toast Notifications**: Replaced all browser alerts with professional toast system
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Polished interactions and transitions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Dark/Light Themes**: Consistent visual design system

## 🛠️ API Documentation

### Authentication Endpoints
```javascript
POST /api/auth/login          // User login
POST /api/auth/register       // User registration
GET  /api/auth/me            // Get current user
```

### Profile Management
```javascript
GET  /api/profile                    // Get current user profile
PUT  /api/profile                    // Update user profile
GET  /api/profile/search             // Search profiles by criteria
GET  /api/profile/skillmatch         // Get enhanced SkillMatch profile
```

### AI Matching System
```javascript
GET  /api/matching/enhanced          // Get AI-powered matches
GET  /api/matching/details/:userId   // Detailed compatibility analysis
POST /api/matching/analyze           // Analyze specific profile compatibility
```

### Communication
```javascript
POST /api/chat                       // Start chat with matched user
GET  /api/chat/:chatId/messages      // Fetch chat message history
```

### Meeting Coordination
```javascript
POST /api/meeting/schedule           // Schedule meeting with user
GET  /api/meeting/meetings           // Get user's meetings
PUT  /api/meeting/:id               // Update meeting details
```

## 💾 Database Schema

### Users Collection (Basic Profile)
```javascript
{
  "clerkId": "user_123abc",
  "email": "user@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "professionalTitle": "Senior Software Engineer",
    "company": "TechCorp"
  },
  "preferences": {
    "skills": ["JavaScript", "React"],
    "interests": ["AI", "Startups"]
  }
}
```

### SkillMatch Collection (Enhanced Profile)
```javascript
{
  "clerkId": "user_123abc",
  "userId": ObjectId("..."),
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "professionalTitle": "Senior Software Engineer",
    "company": "TechCorp",
    "location": {
      "city": "San Francisco",
      "country": "USA"
    },
    "bio": "Passionate about AI and machine learning..."
  },
  "skills": {
    "technical": [
      {
        "name": "JavaScript",
        "level": "expert",
        "yearsUsed": 8
      }
    ],
    "soft": ["Leadership", "Communication"]
  },
  "interests": {
    "professional": ["AI/ML", "Cloud Computing"],
    "personal": ["Photography", "Travel"],
    "learning": ["Kubernetes", "GraphQL"]
  },
  "networkingGoals": [
    {
      "type": "mentorship",
      "description": "Looking to mentor junior developers",
      "priority": "high"
    }
  ]
}
```

## 🚀 Development Guide

### Code Style Guidelines
- **Functional Components**: Use React hooks instead of class components
- **ES6+ Standards**: Modern JavaScript features and syntax
- **Async/Await**: Preferred over promise chains
- **Error Handling**: Comprehensive try-catch blocks
- **Descriptive Naming**: Clear variable and function names
- **JSDoc Comments**: Documentation for complex functions

### Component Naming Conventions
- **PascalCase**: Component files (e.g., `ProfileCard.jsx`)
- **camelCase**: Utility functions and variables
- **UPPER_CASE**: Constants and environment variables
- **Hooks**: Prefix with 'use' (e.g., `useProfile.js`)

### State Management Best Practices
- **React Context**: Global state for auth and matching
- **Local State**: Component-specific data
- **useEffect Cleanup**: Proper cleanup for subscriptions and timers
- **Error Boundaries**: Graceful error handling in components

## 🧪 Testing & Quality Assurance

### Environment Validation
```bash
# Validate backend environment configuration
cd backend && node check-env.js

# Test backend server startup
cd backend && npm run dev

# Test authentication endpoint
curl http://localhost:3001/api/auth/health
```

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Hot Reload**: Instant development feedback
- **Console Manager**: Filtered deprecation warnings
- **Error Boundaries**: Graceful error handling

## 🔒 Security Features

### Authentication & Authorization
- **Clerk Integration**: Enterprise-grade authentication
- **JWT Tokens**: Secure session management
- **Protected Routes**: API endpoint protection
- **Environment Variables**: Secure credential storage

### Data Protection
- **Input Validation**: Comprehensive data sanitization
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Cross-origin request security
- **MongoDB Security**: Atlas cluster protection

## 📊 Performance Optimizations

### Frontend Performance
- **Vite Build Tool**: Fast development and optimized production builds
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Responsive Images**: Optimized asset delivery
- **Component Memoization**: Efficient re-rendering

### Backend Performance
- **MongoDB Indexing**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **Caching Strategies**: API response caching
- **Error Handling**: Graceful degradation

## 🌐 Deployment

### Production Environment Setup
1. **Update Environment Variables** for production
2. **Database Migration**: Set up production MongoDB cluster
3. **API Key Management**: Generate production API keys
4. **SSL Certificates**: Enable HTTPS for secure communication
5. **Performance Monitoring**: Set up logging and analytics

### Deployment Platforms
- **Frontend**: Vercel, Netlify, or AWS S3
- **Backend**: Heroku, Railway, or AWS EC2
- **Database**: MongoDB Atlas (production tier)
- **CDN**: CloudFlare for static assets

## 🤝 Contributing

We welcome contributions to MeetMind! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code style guidelines** and existing patterns
3. **Write comprehensive tests** for new features
4. **Update documentation** for API changes
5. **Submit pull requests** with detailed descriptions

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push to branch
git push origin feature/amazing-feature

# Submit pull request
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for powerful AI language models
- **Clerk** for seamless authentication solutions
- **MongoDB** for flexible, scalable database solutions
- **Fetch.ai** for autonomous agent coordination
- **React & Vite** for excellent development experience
- **Tailwind CSS** for utility-first styling approach

## 📞 Support

For support, questions, or feature requests:


<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/pranavisback)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pranav-pawar-op647)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:pranav647p@gmail.com)


---

**Built with ❤️ by the Pranav** | **Making networking meaningful, one connection at a time**
