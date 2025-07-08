const fetch = require('node-fetch');

// Test default method protection
async function testDefaultProtection() {
  const BASE_URL = 'http://localhost:5001/api';
  const DEFAULT_METHOD_ID = '686cdbda900b0878cc65f05a'; // Replace with actual default method ID
  const NON_DEFAULT_METHOD_ID = '686cdbda900b0878cc65f06b'; // Replace with non-default method ID
  
  // You'll need to get a valid JWT token first
  const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('🧪 Testing Default Method Protection...\n');

  try {
    // Test 1: Try to deactivate default method (should fail)
    console.log('1️⃣ Testing: Try to deactivate default method (should fail)');
    
    const response1 = await fetch(
      `${BASE_URL}/delivery-methods/${DEFAULT_METHOD_ID}/toggle-active`,
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
      console.log('✅ Protection working! Cannot deactivate default method');
      console.log('📋 Error message:', data1.message);
    } else {
      console.log('❌ Protection failed! Default method was deactivated');
      console.log('📋 Response:', data1);
    }
    console.log('');

    // Test 2: Try to update default method to inactive (should fail)
    console.log('2️⃣ Testing: Try to update default method to inactive (should fail)');
    
    const response2 = await fetch(
      `${BASE_URL}/delivery-methods/${DEFAULT_METHOD_ID}`,
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
    
    const data2 = await response2.json();
    
    if (response2.status === 400) {
      console.log('✅ Protection working! Cannot update default method to inactive');
      console.log('📋 Error message:', data2.message);
    } else {
      console.log('❌ Protection failed! Default method was updated to inactive');
      console.log('📋 Response:', data2);
    }
    console.log('');

    // Test 3: Try to create default method as inactive (should fail)
    console.log('3️⃣ Testing: Try to create default method as inactive (should fail)');
    
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
          locationAr: "موقع تجريبي",
          locationEn: "Test Location",
          price: 50,
          whatsappNumber: "+970598516067",
          isDefault: true,
          isActive: false, // This should cause an error
          estimatedDays: 1
        })
      }
    );
    
    const data3 = await response3.json();
    
    if (response3.status === 400) {
      console.log('✅ Protection working! Cannot create default method as inactive');
      console.log('📋 Error message:', data3.message);
    } else {
      console.log('❌ Protection failed! Default method was created as inactive');
      console.log('📋 Response:', data3);
    }
    console.log('');

    // Test 4: Toggle non-default method (should work)
    console.log('4️⃣ Testing: Toggle non-default method (should work)');
    
    const response4 = await fetch(
      `${BASE_URL}/delivery-methods/${NON_DEFAULT_METHOD_ID}/toggle-active`,
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
    
    const data4 = await response4.json();
    
    if (response4.status === 200) {
      console.log('✅ Success! Non-default method can be toggled');
      console.log('📋 Response:', data4);
    } else {
      console.log('❌ Failed to toggle non-default method');
      console.log('📋 Error:', data4);
    }
    console.log('');

    // Test 5: Set another method as default (should work)
    console.log('5️⃣ Testing: Set another method as default (should work)');
    
    const response5 = await fetch(
      `${BASE_URL}/delivery-methods/${NON_DEFAULT_METHOD_ID}/set-default`,
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
    
    const data5 = await response5.json();
    
    if (response5.status === 200) {
      console.log('✅ Success! New default method set');
      console.log('📋 Response:', data5);
    } else {
      console.log('❌ Failed to set new default method');
      console.log('📋 Error:', data5);
    }
    console.log('');

    // Test 6: Try to delete default method (should fail)
    console.log('6️⃣ Testing: Try to delete default method (should fail)');
    
    const response6 = await fetch(
      `${BASE_URL}/delivery-methods/${DEFAULT_METHOD_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
    
    const data6 = await response6.json();
    
    if (response6.status === 400) {
      console.log('✅ Protection working! Cannot delete default method');
      console.log('📋 Error message:', data6.message);
    } else {
      console.log('❌ Protection failed! Default method was deleted');
      console.log('📋 Response:', data6);
    }
    console.log('');

    // Test 7: Delete non-default method (should work)
    console.log('7️⃣ Testing: Delete non-default method (should work)');
    
    const response7 = await fetch(
      `${BASE_URL}/delivery-methods/${NON_DEFAULT_METHOD_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
    
    const data7 = await response7.json();
    
    if (response7.status === 200) {
      console.log('✅ Success! Non-default method can be deleted');
      console.log('📋 Response:', data7);
    } else {
      console.log('❌ Failed to delete non-default method');
      console.log('📋 Error:', data7);
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
testDefaultProtection(); 