// Test the simplified delivery methods API (no store filtering needed)
async function testSimplifiedAPI() {
  const BASE_URL = 'http://localhost:5001/api';
  const DELIVERY_METHOD_ID = '686cc4aedd388afb6a5bc099';
  
  // You'll need to get a valid JWT token first
  const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('🧪 Testing Simplified Delivery Methods API...\n');
  console.log('💡 Note: No store filtering needed since ID is unique across table\n');
  console.log('⚠️  Make sure to replace YOUR_JWT_TOKEN_HERE with a valid token\n');

  try {
    // Test 1: Set delivery method as default
    console.log('1️⃣ Testing PATCH /api/delivery-methods/{id}/set-default');
    
    const response1 = await fetch(
      `${BASE_URL}/delivery-methods/${DELIVERY_METHOD_ID}/set-default`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
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
testSimplifiedAPI(); 