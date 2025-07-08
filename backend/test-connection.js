require('dotenv').config();

console.log('Testing MongoDB URI...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('DB_NAME:', process.env.DB_NAME);

// Test MongoDB connection
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('\nAttempting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'meetmind',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connection successful!');
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
  
  process.exit(0);
}

testConnection();
