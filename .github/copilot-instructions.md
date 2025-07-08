# Copilot Instructions for Event Attendee Matching Engine

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an AI-powered Event Attendee Matching Engine built with:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI Integration**: Groq + Llama for matching algorithms
- **Real-time Communication**: MCP Server
- **Meeting Scheduling**: Fetch.ai agents
- **Database**: JSON files for development (easily upgradeable to MongoDB/PostgreSQL)

## Code Style Guidelines
- Use functional components with React hooks
- Follow ES6+ standards
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Follow React best practices for state management

## Project Structure
- `/frontend` - React application with Vite
- `/backend` - Express.js API server
- `/mcp-server` - MCP protocol server for real-time messaging
- `/fetchai-agents` - Python agents for meeting automation

## Key Features to Maintain
1. **Profile Management**: User registration, profile creation, skills/interests input
2. **AI Matching**: Groq-powered similarity analysis and recommendations
3. **Real-time Chat**: MCP protocol-based messaging system
4. **Meeting Scheduling**: Fetch.ai autonomous agent coordination
5. **Analytics**: Success metrics and user engagement tracking

## API Integration Notes
- All API keys should be stored in environment variables
- Implement rate limiting for external API calls
- Use proper error handling for API failures
- Cache API responses where appropriate

## Component Naming Convention
- Use PascalCase for component files (e.g., ProfileCard.jsx)
- Use camelCase for utility functions
- Use UPPER_CASE for constants
- Prefix hooks with 'use' (e.g., useProfile.js)

## State Management
- Use React Context for global state (auth, matching)
- Use local state for component-specific data
- Implement proper cleanup in useEffect hooks
