const fetch = require('node-fetch');

// Test inactive method default protection
async function testInactiveDefaultProtection() {
  const BASE_URL = 'http://localhost:5001/api';
  const INACTIVE_METHOD_ID = '686cdbda900b0878cc65f05a'; // Replace with actual inactive method ID
  const ACTIVE_METHOD_ID = '686cdbda900b0878cc65f06b'; // Replace with actual active method ID
  
  // You'll need to get a valid JWT token first
  const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('🧪 Testing Inactive Method Default Protection...\n');

  try {
    // Test 1: Try to set inactive method as default (should fail)
    console.log('1️⃣ Testing: Try to set inactive method as default (should fail)');
    
    const response1 = await fetch(
      `${BASE_URL}/delivery-methods/${INACTIVE_METHOD_ID}/set-default`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
    
    const data1 = await response1.json();
    
    if (response1.status === 400) {
      console.log('✅ Protection working! Cannot set inactive method as default');
      console.log('📋 Error message:', data1.message);
    } else {
      console.log('❌ Protection failed! Inactive method was set as default');
      console.log('📋 Response:', data1);
    }
    console.log('');

    // Test 2: Set active method as default (should work)
    console.log('2️⃣ Testing: Set active method as default (should work)');
    
    const response2 = await fetch(
      `${BASE_URL}/delivery-methods/${ACTIVE_METHOD_ID}/set-default`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
    
    const data2 = await response2.json();
    
    if (response2.status === 200) {
      console.log('✅ Success! Active method can be set as default');
      console.log('📋 Response:', data2);
    } else {
      console.log('❌ Failed to set active method as default');
      console.log('📋 Error:', data2);
    }
    console.log('');

    // Test 3: Try to create inactive method as default (should fail)
    console.log('3️⃣ Testing: Try to create inactive method as default (should fail)');
    
    const response3 = await fetch(
      `${BASE_URL}/delivery-methods`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          locationAr: "موقع معطل",
          locationEn: "Inactive Location",
          price: 30,
          whatsappNumber: "+970598516067",
          isDefault: true,
          isActive: false, // This should cause an error
          estimatedDays: 1
        })
      }
    );
    
    const data3 = await response3.json();
    
    if (response3.status === 400) {
      console.log('✅ Protection working! Cannot create inactive method as default');
      console.log('📋 Error message:', data3.message);
    } else {
      console.log('❌ Protection failed! Inactive method was created as default');
      console.log('📋 Response:', data3);
    }
    console.log('');

    // Test 4: Try to update method to inactive while it's default (should fail)
    console.log('4️⃣ Testing: Try to update default method to inactive (should fail)');
    
    const response4 = await fetch(
      `${BASE_URL}/delivery-methods/${ACTIVE_METHOD_ID}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          isActive: false
        })
      }
    );
    
    const data4 = await response4.json();
    
    if (response4.status === 400) {
      console.log('✅ Protection working! Cannot update default method to inactive');
      console.log('📋 Error message:', data4.message);
    } else {
      console.log('❌ Protection failed! Default method was updated to inactive');
      console.log('📋 Response:', data4);
    }
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
testInactiveDefaultProtection(); 