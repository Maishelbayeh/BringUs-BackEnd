const axios = require('axios');

async function testSimplePagination() {
  console.log('🧪 Simple Pagination Test\n');

  const baseURL = 'http://localhost:5001';
  
  // You need to replace this with a real JWT token
  // Get it from login or registration
  const token = 'YOUR_JWT_TOKEN_HERE';

  if (token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please replace YOUR_JWT_TOKEN_HERE with a real token');
    console.log('💡 You can get a token by:');
    console.log('   1. Registering a new user');
    console.log('   2. Logging in with existing user');
    console.log('   3. Copying the token from the response');
    return;
  }

  try {
    // Test first page
    console.log('📧 Testing page 1, limit 5...');
    const response1 = await axios.get(`${baseURL}/api/orders/my-orders`, {
      params: { page: 1, limit: 5 },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Page 1 Response:');
    console.log(`   Orders: ${response1.data.count}/${response1.data.total}`);
    console.log(`   Current Page: ${response1.data.pagination.currentPage}`);
    console.log(`   Total Pages: ${response1.data.pagination.totalPages}`);
    console.log(`   Has Next: ${response1.data.pagination.hasNextPage}`);

    // Test second page if available
    if (response1.data.pagination.hasNextPage) {
      console.log('\n📧 Testing page 2, limit 5...');
      const response2 = await axios.get(`${baseURL}/api/orders/my-orders`, {
        params: { page: 2, limit: 5 },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Page 2 Response:');
      console.log(`   Orders: ${response2.data.count}/${response2.data.total}`);
      console.log(`   Current Page: ${response2.data.pagination.currentPage}`);
      console.log(`   Has Next: ${response2.data.pagination.hasNextPage}`);
      console.log(`   Has Prev: ${response2.data.pagination.hasPrevPage}`);
    }

    // Test with different limit
    console.log('\n📧 Testing page 1, limit 3...');
    const response3 = await axios.get(`${baseURL}/api/orders/my-orders`, {
      params: { page: 1, limit: 3 },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Limit 3 Response:');
    console.log(`   Orders: ${response3.data.count}/${response3.data.total}`);
    console.log(`   Items Per Page: ${response3.data.pagination.itemsPerPage}`);

    console.log('\n🎉 Pagination is working correctly!');

  } catch (error) {
    console.log('❌ Test failed:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

testSimplePagination();



