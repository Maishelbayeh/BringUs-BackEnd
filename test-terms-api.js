const fetch = require('node-fetch');

const testTermsAPI = async () => {
  const storeId = '687505893fbf3098648bfe16';
  const baseUrl = 'http://localhost:5001'; // Backend port
  
  console.log('🧪 Testing Terms & Conditions API...');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server health...');
    const healthResponse = await fetch(`${baseUrl}/api`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData.message);
    } else {
      console.log('❌ Server health check failed');
      return;
    }
    
    // Test 2: Test terms endpoint without auth (should fail)
    console.log('\n2. Testing terms endpoint without authentication...');
    try {
      const termsResponse = await fetch(`${baseUrl}/api/terms-conditions/stores/${storeId}/terms`);
      const termsData = await termsResponse.json();
      console.log('Response status:', termsResponse.status);
      console.log('Response data:', termsData);
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    // Test 3: Test with mock token (since auth is bypassed)
    console.log('\n3. Testing terms endpoint with mock authentication...');
    try {
      const termsResponse = await fetch(`${baseUrl}/api/terms-conditions/stores/${storeId}/terms`, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      const termsData = await termsResponse.json();
      console.log('Response status:', termsResponse.status);
      console.log('Response data:', termsData);
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    // Test 4: Test CORS preflight
    console.log('\n4. Testing CORS preflight...');
    try {
      const corsResponse = await fetch(`${baseUrl}/api/terms-conditions/stores/${storeId}/terms`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization,Content-Type'
        }
      });
      console.log('CORS preflight status:', corsResponse.status);
      console.log('CORS headers:', {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
      });
    } catch (error) {
      console.log('❌ CORS test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testTermsAPI(); 