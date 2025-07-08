# 🚀 MeetMind Setup Instructions

## 📋 Prerequisites

Before setting up MeetMind, you'll need to obtain API keys from the following services:

1. **Clerk** (Authentication) - [clerk.dev](https://clerk.dev)
2. **Groq** (AI Matching) - [groq.com](https://groq.com)
3. **MongoDB Atlas** (Database) - [mongodb.com](https://mongodb.com)
4. **Fetch.ai** (Optional - Meeting Agents) - [fetch.ai](https://fetch.ai)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/pranavisback/MeetMind.git
cd MeetMind
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Environment (.env)
Create or update `.env` file in the root directory:
```bash
# Development environment variables
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Clerk Authentication - Replace with your Clerk keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# AI API Keys - Replace with your actual API keys
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
VITE_FETCHAI_API_KEY=sk_your_fetchai_api_key_here
```

#### Backend Environment (backend/.env)
Create or update `backend/.env` file:
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secure_jwt_secret_here

# Clerk Authentication - Replace with your Clerk keys
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Database - Replace with your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meetmind
DB_NAME=meetmind

# AI API Keys - Replace with your actual API keys
GROQ_API_KEY=gsk_your_groq_api_key_here
FETCHAI_API_KEY=sk_your_fetchai_api_key_here
```

## 🔑 API Key Setup Guide

### 1. Clerk Authentication Setup
1. Go to [clerk.dev](https://clerk.dev) and create an account
2. Create a new application
3. Go to "API Keys" in your Clerk dashboard
4. Copy the **Publishable Key** (starts with `pk_test_`)
5. Copy the **Secret Key** (starts with `sk_test_`)
6. Paste them in both `.env` files

### 2. Groq AI API Setup
1. Visit [groq.com](https://groq.com) and sign up
2. Navigate to API section or developer console
3. Generate a new API key (starts with `gsk_`)
4. Copy and paste it in both `.env` files

### 3. MongoDB Atlas Setup
1. Go to [mongodb.com](https://mongodb.com) and create an account
2. Create a new cluster (free tier available)
3. Set up database access (username/password)
4. Get your connection string (looks like `mongodb+srv://...`)
5. Replace placeholder in `backend/.env`

### 4. Fetch.ai Setup (Optional)
1. Visit [fetch.ai](https://fetch.ai) developer portal
2. Create account and generate API key (starts with `sk_`)
3. Add to both `.env` files

## 🏃‍♂️ Running the Application

### Method 1: Manual Start
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
npm run dev
```

### Method 2: Using VS Code Tasks
1. Open project in VS Code
2. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
3. Type "Tasks: Run Task"
4. Select "Start Backend (Express)"
5. Repeat and select "Start Frontend (React)"

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/auth/health

## 🧪 Testing the Setup

1. **Environment Validation**:
```bash
cd backend
node check-env.js
```

2. **API Test**:
```bash
curl http://localhost:3001/api/auth/health
```

3. **Frontend Test**:
- Open http://localhost:5173
- Try registering a new account
- Complete your profile
- Test AI matching features

## 🚨 Troubleshooting

### Common Issues:

**1. "Clerk keys not found"**
- Double-check your Clerk API keys
- Ensure they start with `pk_test_` and `sk_test_`
- Verify `.env` files are in correct directories

**2. "Database connection failed"**
- Check MongoDB URI format
- Ensure database user has proper permissions
- Verify network access in MongoDB Atlas

**3. "Groq API errors"**
- Confirm Groq API key is valid
- Check if you have API quota remaining
- Verify key starts with `gsk_`

**4. "Port already in use"**
- Kill processes on ports 3001 and 5173
- Or change ports in environment variables

### Environment File Locations:
```
MeetMind/
├── .env                    # Frontend environment
├── backend/
│   └── .env               # Backend environment
```

## 🔒 Security Notes

- Never commit real API keys to version control
- Use different keys for development and production
- Regularly rotate your API keys
- Keep `.env` files in `.gitignore`

## 📱 Features to Test

1. **User Registration** - Clerk authentication flow
2. **Profile Creation** - Smart suggestions system
3. **AI Matching** - Groq-powered compatibility analysis
4. **Real-time Chat** - WebSocket messaging
5. **Meeting Scheduling** - AI-suggested topics

## 🏆 Ready for Demo!

Once setup is complete, your MeetMind application will have:
- ✅ Secure authentication
- ✅ AI-powered matching
- ✅ Real-time communication
- ✅ Professional UI/UX
- ✅ Production-ready features

## 🆘 Need Help?

If you encounter issues during setup:
1. Check the troubleshooting section above
2. Verify all API keys are correctly formatted
3. Ensure all dependencies are installed
4. Check console logs for specific error messages

---

**MeetMind - Making networking meaningful, one connection at a time** 🧠✨
