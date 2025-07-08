const mongoose = require('mongoose');
require('dotenv').config();

async function fixUsernameIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'meetmind'
    });

    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check existing indexes
    const indexes = await usersCollection.indexes();
    console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the username index if it exists
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ Dropped existing username index');
    } catch (error) {
      console.log('ℹ️ Username index does not exist or already dropped');
    }

    // Create a new sparse unique index for username
    await usersCollection.createIndex(
      { username: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'username_1_sparse'
      }
    );
    console.log('✅ Created new sparse unique index for username');

    // Verify the new indexes
    const newIndexes = await usersCollection.indexes();
    console.log('Updated indexes:', newIndexes.map(idx => ({ name: idx.name, key: idx.key, sparse: idx.sparse })));

    console.log('✅ Username index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing username index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the fix
fixUsernameIndex();
