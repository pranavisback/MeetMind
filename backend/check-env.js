#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this to check if all required environment variables are properly set
 */

require('dotenv').config();

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'MONGODB_URI',
  'DB_NAME',
  'GROQ_API_KEY',
  'FETCHAI_API_KEY'
];

const optionalVars = [
  'JWT_SECRET'
];

console.log('🔍 Environment Variables Validation\n');

let allValid = true;

// Check required variables
console.log('✅ Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue = ['SECRET', 'KEY', 'URI', 'API'].some(keyword => 
      varName.includes(keyword)
    ) ? value.substring(0, 10) + '...' : value;
    
    console.log(`  ✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ✗ ${varName}: MISSING`);
    allValid = false;
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') ? 
      value.substring(0, 10) + '...' : value;
    console.log(`  ✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`  - ${varName}: Not set`);
  }
});

// Specific validations
console.log('\n🔧 Validation Checks:');

// Check Clerk keys format
const clerkPubKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (clerkPubKey && clerkPubKey.startsWith('pk_test_')) {
  console.log('  ✓ Clerk Publishable Key format: Valid');
} else {
  console.log('  ✗ Clerk Publishable Key format: Invalid (should start with pk_test_)');
  allValid = false;
}

if (clerkSecretKey && clerkSecretKey.startsWith('sk_test_')) {
  console.log('  ✓ Clerk Secret Key format: Valid');
} else {
  console.log('  ✗ Clerk Secret Key format: Invalid (should start with sk_test_)');
  allValid = false;
}

// Check MongoDB URI format
const mongoUri = process.env.MONGODB_URI;
if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
  console.log('  ✓ MongoDB URI format: Valid');
} else {
  console.log('  ✗ MongoDB URI format: Invalid (should start with mongodb+srv://)');
  allValid = false;
}

// Check API keys format
const groqKey = process.env.GROQ_API_KEY;
if (groqKey && groqKey.startsWith('gsk_')) {
  console.log('  ✓ Groq API Key format: Valid');
} else {
  console.log('  ✗ Groq API Key format: Invalid (should start with gsk_)');
  allValid = false;
}

const fetchaiKey = process.env.FETCHAI_API_KEY;
if (fetchaiKey && fetchaiKey.startsWith('sk_')) {
  console.log('  ✓ Fetch.ai API Key format: Valid');
} else {
  console.log('  ✗ Fetch.ai API Key format: Invalid (should start with sk_)');
  allValid = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 All environment variables are properly configured!');
  console.log('✅ Your backend is ready to run.');
} else {
  console.log('❌ Some environment variables need attention.');
  console.log('🔧 Please check the issues above and update your .env file.');
}
console.log('='.repeat(50));
