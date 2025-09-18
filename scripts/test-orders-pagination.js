const axios = require('axios');

async function testOrdersPagination() {
  console.log('🧪 Testing Orders Pagination\n');

  const baseURL = 'http://localhost:5001';
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  console.log('📋 Test Details:');
  console.log(`   Base URL: ${baseURL}`);
  console.log(`   Route: GET /api/orders/my-orders`);
  console.log('   Authentication: Required (JWT Token)');

  // Test different pagination scenarios
  const testCases = [
    { page: 1, limit: 5, description: 'First page, 5 items' },
    { page: 2, limit: 5, description: 'Second page, 5 items' },
    { page: 1, limit: 10, description: 'First page, 10 items' },
    { page: 1, limit: 3, description: 'First page, 3 items' },
    { page: 1, limit: 10, status: 'pending', description: 'First page, 10 items, pending status' }
  ];

  for (const testCase of testCases) {
    console.log(`\n📧 Testing: ${testCase.description}`);
    
    try {
      const params = {
        page: testCase.page,
        limit: testCase.limit
      };

      if (testCase.status) {
        params.status = testCase.status;
      }

      const response = await axios.get(`${baseURL}/api/orders/my-orders`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Request successful!`);
      console.log(`📊 Status Code: ${response.status}`);
      
      if (response.data) {
        console.log(`📄 Response Summary:`);
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Orders Count: ${response.data.count}`);
        console.log(`   Total Orders: ${response.data.total}`);
        
        if (response.data.pagination) {
          const pagination = response.data.pagination;
          console.log(`📄 Pagination Info:`);
          console.log(`   Current Page: ${pagination.currentPage}`);
          console.log(`   Total Pages: ${pagination.totalPages}`);
          console.log(`   Total Items: ${pagination.totalItems}`);
          console.log(`   Items Per Page: ${pagination.itemsPerPage}`);
          console.log(`   Has Next Page: ${pagination.hasNextPage}`);
          console.log(`   Has Prev Page: ${pagination.hasPrevPage}`);
        }

        if (response.data.data && response.data.data.length > 0) {
          console.log(`📦 Sample Order:`);
          const sampleOrder = response.data.data[0];
          console.log(`   Order Number: ${sampleOrder.orderNumber}`);
          console.log(`   Status: ${sampleOrder.status}`);
          console.log(`   Price: ${sampleOrder.price}`);
          console.log(`   Items Count: ${sampleOrder.itemsCount}`);
        }
      }

    } catch (error) {
      console.log(`❌ Request failed!`);
      
      if (error.response) {
        console.log(`📊 Status Code: ${error.response.status}`);
        console.log(`📊 Status Text: ${error.response.statusText}`);
        
        if (error.response.data) {
          console.log('📄 Error Response:');
          console.log('   Success:', error.response.data.success);
          console.log('   Message:', error.response.data.message);
        }
      } else if (error.request) {
        console.log('📡 No response received');
        console.log('   Error:', error.message);
      } else {
        console.log('❌ Request setup error');
        console.log('   Error:', error.message);
      }
    }
  }

  console.log('\n🔍 Pagination Test Summary:');
  console.log('1. Check if pagination parameters are working');
  console.log('2. Verify total count is correct');
  console.log('3. Verify page calculations are accurate');
  console.log('4. Check if hasNextPage and hasPrevPage are correct');
  console.log('5. Verify status filtering works with pagination');
}

// Test without authentication (should fail)
async function testWithoutAuth() {
  console.log('\n🧪 Testing Without Authentication\n');

  const baseURL = 'http://localhost:5001';

  try {
    const response = await axios.get(`${baseURL}/api/orders/my-orders`, {
      params: { page: 1, limit: 5 },
      timeout: 5000
    });

    console.log('⚠️  Unexpected success without authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Test with invalid pagination parameters
async function testInvalidParams() {
  console.log('\n🧪 Testing Invalid Pagination Parameters\n');

  const baseURL = 'http://localhost:5001';
  const token = 'YOUR_JWT_TOKEN_HERE';

  const invalidTests = [
    { page: 0, limit: 5, description: 'Page 0 (invalid)' },
    { page: 1, limit: 0, description: 'Limit 0 (invalid)' },
    { page: -1, limit: 5, description: 'Negative page' },
    { page: 1, limit: 1000, description: 'Very large limit' }
  ];

  for (const test of invalidTests) {
    console.log(`\n📧 Testing: ${test.description}`);
    
    try {
      const response = await axios.get(`${baseURL}/api/orders/my-orders`, {
        params: { page: test.page, limit: test.limit },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`✅ Request succeeded (may be handled gracefully)`);
      console.log(`📊 Status Code: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ Request failed as expected`);
        console.log(`📊 Status Code: ${error.response.status}`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
  }
}

// Run all tests
async function runTests() {
  try {
    await testOrdersPagination();
    await testWithoutAuth();
    await testInvalidParams();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();



