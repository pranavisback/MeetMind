const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Clerk webhook endpoint for user create/update
router.post('/clerk', async (req, res) => {
  try {
    const event = req.body;
    // Clerk sends user data in event.data
    const userData = event.data;
    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'Invalid Clerk webhook payload' });
    }
    // Extract email from Clerk (works for email, GitHub, Facebook, etc.)
    let email = '';
    if (userData.email_addresses && userData.email_addresses.length > 0) {
      email = userData.email_addresses[0].email_address;
    } else if (userData.external_accounts && userData.external_accounts.length > 0) {
      email = userData.external_accounts[0].email;
    }
    if (!email) {
      return res.status(400).json({ error: 'No email found in Clerk webhook' });
    }
    // Upsert user in MongoDB
    await User.findOneAndUpdate(
      { clerkId: userData.id },
      { $set: { email } },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'User synced from Clerk webhook' });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
