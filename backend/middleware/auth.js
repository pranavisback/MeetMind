const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const SkillMatch = require('../models/SkillMatch');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    console.log('Received token:', token);
    // Verify Clerk JWT token
    const payload = await clerkClient.verifyToken(token);
    console.log('Payload after verification:', payload);
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    // Find or create user in MongoDB
    console.log('Looking up user with clerkId:', payload.sub);
    let user = await User.findOne({ clerkId: payload.sub });
    console.log('User lookup result:', user);
    if (!user) {
      console.log('No user found. Creating a new user with clerkId:', payload.sub);
      // Fetch Clerk user for email
      const clerkUser = await clerkClient.users.getUser(payload.sub);
      let email = '';
      if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
        email = clerkUser.emailAddresses[0].emailAddress;
      } else if (clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0) {
        email = clerkUser.externalAccounts[0].email;
      }
      
      // Create user in User collection
      user = await User.create({ clerkId: payload.sub, email });
      
      // Also create a profile in SkillMatch collection
      try {
        await SkillMatch.create({
          clerkId: payload.sub,
          userId: user._id,
          profile: {
            email: email,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || ''
          }
        });
        console.log('✅ Created SkillMatch profile for new user');
      } catch (skillMatchError) {
        console.log('⚠️ Could not create SkillMatch profile:', skillMatchError.message);
      }
    }
    req.user = user;
    req.clerkUser = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.message?.includes('Invalid token') || error.message?.includes('JWT')) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware;
