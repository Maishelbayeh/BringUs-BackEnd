const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testCreateUser() {
  try {
    console.log('🧪 Testing User Creation API...\n');
    
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      phone: '+1234567890',
      role: 'client'
    };
    
    console.log('📝 Creating user with data:', userData);
    
    const response = await axios.post(`${BASE_URL}/users`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User created successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating user:', error.response?.data || error.message);
    return null;
  }
}

async function testGetUsers() {
  try {
    console.log('\n📋 Testing Get Users API...\n');
    
    const response = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Users retrieved successfully!');
    console.log(`📊 Found ${response.data.data.length} users`);
    console.log('📋 Users:', JSON.stringify(response.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error getting users:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting User API Tests...\n');
  
  // Test user creation
  const createdUser = await testCreateUser();
  
  if (createdUser) {
    // Test getting users
    await testGetUsers();
  }
  
  console.log('\n🎉 User API tests completed!');
}

// Run tests
runTests().catch(console.error); 