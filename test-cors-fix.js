const fetch = require('node-fetch');

// Test CORS fix for delivery methods API
async function testCorsFix() {
  const BASE_URL = 'http://localhost:5001/api';
  const DELIVERY_METHOD_ID = '686cdbda900b0878cc65f05a';
  
  // You'll need to get a valid JWT token first
  const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('🧪 Testing CORS Fix for Delivery Methods API...\n');

  try {
    // Test 1: Set delivery method as default
    console.log('1️⃣ Testing PATCH /api/delivery-methods/{id}/set-default');
    
    const response1 = await fetch(
      `${BASE_URL}/delivery-methods/${DELIVERY_METHOD_ID}/set-default`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'http://localhost:5173',
          'Referer': 'http://localhost:5173/'
        }
      }
    );
    
    console.log('Response Status:', response1.status);
    console.log('Response Headers:', Object.fromEntries(response1.headers.entries()));
    
    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${response1.statusText}`);
    }
    
    const data1 = await response1.json();
    
    if (data1.success) {
      console.log('✅ Set Default Success!');
      console.log('📋 Response:', JSON.stringify(data1, null, 2));
    } else {
      console.log('❌ Set Default Failed:', data1.message);
    }
    console.log('');

    // Test 2: Test OPTIONS request (preflight)
    console.log('2️⃣ Testing OPTIONS request (preflight)');
    
    const response2 = await fetch(
      `${BASE_URL}/delivery-methods/${DELIVERY_METHOD_ID}/set-default`,
      {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'PATCH',
          'Access-Control-Request-Headers': 'Content-Type, Authorization, Accept, X-Requested-With'
        }
      }
    );
    
    console.log('OPTIONS Response Status:', response2.status);
    console.log('OPTIONS Response Headers:', Object.fromEntries(response2.headers.entries()));
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 You need to authenticate first. Get a JWT token by logging in.');
      console.log('Example:');
      console.log('curl -X POST "http://localhost:5001/api/auth/login" \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"email": "your-email@example.com", "password": "your-password"}\'');
    } else if (error.message.includes('fetch failed')) {
      console.log('\n💡 Make sure the server is running on http://localhost:5001');
      console.log('💡 Check if the server is started with: npm start');
    }
  }
}

// Run the test
testCorsFix(); 