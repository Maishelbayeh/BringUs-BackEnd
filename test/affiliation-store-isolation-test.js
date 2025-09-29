const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';

/**
 * Test Affiliation Store Isolation
 * This test verifies that the same email can be used in different stores
 */
async function testAffiliationStoreIsolation() {
  console.log('🧪 Testing Affiliation Store Isolation...\n');

  try {
    // Test 1: Create affiliate in Store 1
    console.log('1️⃣ Creating affiliate in Store 1...');
    try {
      const affiliate1Data = {
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmed@example.com",
        password: "password123",
        mobile: "+970599888888",
        address: "الخليل، فلسطين",
        percent: 8
      };

      // You need to provide a valid store token for Store 1
      const response1 = await axios.post(`${BASE_URL}/affiliations`, affiliate1Data, {
        headers: {
          'Authorization': 'Bearer YOUR_STORE_1_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Affiliate created in Store 1:', response1.data);
    } catch (error) {
      console.log('❌ Store 1 affiliate creation failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Create affiliate with same email in Store 2
    console.log('2️⃣ Creating affiliate with same email in Store 2...');
    try {
      const affiliate2Data = {
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmed@example.com", // Same email
        password: "password123",
        mobile: "+970599888888",
        address: "رام الله، فلسطين",
        percent: 10
      };

      // You need to provide a valid store token for Store 2
      const response2 = await axios.post(`${BASE_URL}/affiliations`, affiliate2Data, {
        headers: {
          'Authorization': 'Bearer YOUR_STORE_2_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Affiliate created in Store 2:', response2.data);
    } catch (error) {
      console.log('❌ Store 2 affiliate creation failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Try to create duplicate affiliate in same store
    console.log('3️⃣ Trying to create duplicate affiliate in same store...');
    try {
      const duplicateData = {
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmed@example.com", // Same email as Test 1
        password: "password123",
        mobile: "+970599888888",
        address: "الخليل، فلسطين",
        percent: 8
      };

      const response3 = await axios.post(`${BASE_URL}/affiliations`, duplicateData, {
        headers: {
          'Authorization': 'Bearer YOUR_STORE_1_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ This should have failed but succeeded:', response3.data);
    } catch (error) {
      console.log('✅ Correctly rejected duplicate in same store:', error.response?.data?.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test login with storeSlug
    console.log('4️⃣ Testing login with storeSlug...');
    try {
      const loginData = {
        email: "ahmed@example.com",
        password: "password123",
        storeSlug: "store1" // Specify which store to login to
      };

      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ Login successful with storeSlug:', {
        user: loginResponse.data.user,
        store: loginResponse.data.user.store
      });
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Test login with different storeSlug
    console.log('5️⃣ Testing login with different storeSlug...');
    try {
      const loginData2 = {
        email: "ahmed@example.com",
        password: "password123",
        storeSlug: "store2" // Different store
      };

      const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, loginData2);
      console.log('✅ Login successful with different storeSlug:', {
        user: loginResponse2.data.user,
        store: loginResponse2.data.user.store
      });
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }

  console.log('\n🏁 Affiliation Store Isolation Tests Completed!');
}

/**
 * Generate test scenarios
 */
function generateTestScenarios() {
  console.log('📋 Test Scenarios for Affiliation Store Isolation:\n');

  console.log('🔧 Setup Required:');
  console.log('1. Create two stores with different slugs (e.g., "store1", "store2")');
  console.log('2. Get authentication tokens for both stores');
  console.log('3. Update the test with real tokens\n');

  console.log('📝 Test Cases:');
  console.log('1. ✅ Create affiliate in Store 1 with email "ahmed@example.com"');
  console.log('2. ✅ Create affiliate in Store 2 with same email "ahmed@example.com"');
  console.log('3. ❌ Try to create duplicate affiliate in Store 1 (should fail)');
  console.log('4. ✅ Login to Store 1 with storeSlug="store1"');
  console.log('5. ✅ Login to Store 2 with storeSlug="store2"');
  console.log('6. ❌ Login without storeSlug (should fail or find first match)');

  console.log('\n🔑 Key Points:');
  console.log('- Same email can exist in different stores');
  console.log('- Each store has its own user records');
  console.log('- Login requires storeSlug to identify correct store');
  console.log('- Store isolation prevents cross-store conflicts');
}

/**
 * Generate curl commands for testing
 */
function generateCurlCommands() {
  console.log('📋 Curl Commands for Testing:\n');

  console.log('1️⃣ Create affiliate in Store 1:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/affiliations' \\
  -H 'accept: application/json' \\
  -H 'Authorization: Bearer YOUR_STORE_1_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "password": "password123",
    "mobile": "+970599888888",
    "address": "الخليل، فلسطين",
    "percent": 8
  }'`);

  console.log('\n2️⃣ Create affiliate in Store 2 (same email):');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/affiliations' \\
  -H 'accept: application/json' \\
  -H 'Authorization: Bearer YOUR_STORE_2_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "password": "password123",
    "mobile": "+970599888888",
    "address": "رام الله، فلسطين",
    "percent": 10
  }'`);

  console.log('\n3️⃣ Login to Store 1:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/auth/login' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "ahmed@example.com",
    "password": "password123",
    "storeSlug": "store1"
  }'`);

  console.log('\n4️⃣ Login to Store 2:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/auth/login' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "ahmed@example.com",
    "password": "password123",
    "storeSlug": "store2"
  }'`);
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Affiliation Store Isolation Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  generateTestScenarios();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  generateCurlCommands();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  testAffiliationStoreIsolation()
    .then(() => {
      console.log('\n✅ All tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testAffiliationStoreIsolation,
  generateTestScenarios,
  generateCurlCommands
};
