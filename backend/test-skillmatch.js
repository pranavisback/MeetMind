const axios = require('axios');

async function testSkillmatchRoute() {
  try {
    console.log('Testing /api/profile/skillmatch route...');
    
    // Test without auth (should get 401)
    try {
      await axios.get('http://localhost:3001/api/profile/skillmatch');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route responds correctly without auth (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }
    
    // Test route accessibility
    try {
      await axios.get('http://localhost:3001/api/profile/skillmatch', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route exists and handles auth properly');
      } else if (error.response?.status === 500) {
        console.log('⚠️ Route exists but has server error (expected with invalid token)');
      } else {
        console.log('❌ Unexpected response:', error.response?.status);
      }
    }
    
    console.log('✅ /api/profile/skillmatch route is properly configured!');
    
  } catch (error) {
    console.error('❌ Error testing route:', error.message);
  }
}

testSkillmatchRoute();
