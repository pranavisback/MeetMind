#!/usr/bin/env node

/**
 * MeetMind Setup and Health Check Script
 * 
 * This script verifies that all components of the MeetMind application
 * are properly configured and working.
 */

const axios = require('axios');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`, 'blue');
}

/**
 * Check if required environment variables are set
 */
function checkEnvironmentVariables() {
  logHeader('Checking Environment Variables');
  
  const requiredVars = [
    'MONGODB_URI',
    'CLERK_PUBLISHABLE_KEY', 
    'CLERK_SECRET_KEY',
    'GROQ_API_KEY'
  ];

  const optionalVars = [
    'FETCHAI_API_KEY',
    'JWT_SECRET',
    'PORT',
    'FRONTEND_URL'
  ];

  let allRequired = true;

  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing (required)`);
      allRequired = false;
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logWarning(`${varName} is not set (optional)`);
    }
  });

  return allRequired;
}

/**
 * Test MongoDB connection
 */
async function testMongoDBConnection() {
  logHeader('Testing MongoDB Connection');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    logSuccess('MongoDB connection successful');
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    await testCollection.deleteMany({ test: true });
    
    logSuccess('MongoDB read/write operations working');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test Groq API connection
 */
async function testGroqAPI() {
  logHeader('Testing Groq API Connection');
  
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message. Please respond with "API connection successful".'
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 50,
    });

    if (completion.choices[0]?.message?.content) {
      logSuccess('Groq API connection successful');
      logInfo(`Response: ${completion.choices[0].message.content}`);
      return true;
    } else {
      logError('Groq API returned empty response');
      return false;
    }
  } catch (error) {
    logError(`Groq API connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test Backend Server
 */
async function testBackendServer() {
  logHeader('Testing Backend Server');
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${backendUrl}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.status === 200) {
      logSuccess('Backend server health check passed');
    } else {
      logError(`Backend server health check failed with status: ${healthResponse.status}`);
      return false;
    }

    // Test API base endpoint
    const apiResponse = await axios.get(`${backendUrl}/`, {
      timeout: 5000
    });
    
    if (apiResponse.status === 200) {
      logSuccess('Backend API endpoint accessible');
      return true;
    } else {
      logError(`Backend API endpoint failed with status: ${apiResponse.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Backend server is not running. Please start it with: npm run dev');
    } else {
      logError(`Backend server test failed: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test Frontend Server
 */
async function testFrontendServer() {
  logHeader('Testing Frontend Server');
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  try {
    const response = await axios.get(frontendUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'text/html'
      }
    });
    
    if (response.status === 200) {
      logSuccess('Frontend server is accessible');
      return true;
    } else {
      logError(`Frontend server failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logWarning('Frontend server is not running. Start it with: npm run dev');
    } else {
      logError(`Frontend server test failed: ${error.message}`);
    }
    return false;
  }
}

/**
 * Check package.json dependencies
 */
function checkDependencies() {
  logHeader('Checking Dependencies');
  
  try {
    const backendPackage = require('./backend/package.json');
    const frontendPackage = require('./package.json');
    
    // Check critical backend dependencies
    const criticalBackendDeps = [
      'express',
      'mongoose', 
      'groq-sdk',
      '@clerk/clerk-sdk-node',
      'socket.io'
    ];
    
    const criticalFrontendDeps = [
      'react',
      '@clerk/clerk-react',
      'axios',
      'socket.io-client'
    ];
    
    logInfo('Backend dependencies:');
    criticalBackendDeps.forEach(dep => {
      if (backendPackage.dependencies[dep]) {
        logSuccess(`  ${dep}: ${backendPackage.dependencies[dep]}`);
      } else {
        logError(`  ${dep}: Missing`);
      }
    });
    
    logInfo('Frontend dependencies:');
    criticalFrontendDeps.forEach(dep => {
      if (frontendPackage.dependencies[dep]) {
        logSuccess(`  ${dep}: ${frontendPackage.dependencies[dep]}`);
      } else {
        logError(`  ${dep}: Missing`);
      }
    });
    
    return true;
  } catch (error) {
    logError(`Error checking dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Generate setup report
 */
function generateSetupReport(results) {
  logHeader('Setup Report');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\nSetup Completion: ${percentage}% (${passedChecks}/${totalChecks} checks passed)\n`);
  
  Object.entries(results).forEach(([check, passed]) => {
    if (passed) {
      logSuccess(check);
    } else {
      logError(check);
    }
  });
  
  if (percentage === 100) {
    log('\n🎉 MeetMind is fully configured and ready to use!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start the backend: cd backend && npm run dev');
    log('2. Start the frontend: npm run dev');
    log('3. Visit http://localhost:5173 to use the application');
  } else if (percentage >= 80) {
    log('\n✅ MeetMind is mostly configured but has some optional issues.', 'yellow');
    log('The application should work with basic functionality.');
  } else {
    log('\n❌ MeetMind setup is incomplete.', 'red');
    log('Please fix the failing checks before running the application.');
  }
}

/**
 * Main setup check function
 */
async function main() {
  log(colors.bold + '🧠 MeetMind Setup Health Check' + colors.reset);
  log('Verifying all components are properly configured...\n');
  
  const results = {};
  
  // Run all checks
  results['Environment Variables'] = checkEnvironmentVariables();
  results['Dependencies'] = checkDependencies();
  results['MongoDB Connection'] = await testMongoDBConnection();
  results['Groq API'] = await testGroqAPI();
  results['Backend Server'] = await testBackendServer();
  results['Frontend Server'] = await testFrontendServer();
  
  // Generate report
  generateSetupReport(results);
}

// Run the health check
if (require.main === module) {
  main().catch(error => {
    logError(`Health check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentVariables,
  testMongoDBConnection,
  testGroqAPI,
  testBackendServer,
  testFrontendServer,
  checkDependencies
};
