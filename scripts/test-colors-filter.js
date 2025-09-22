const axios = require('axios');

async function testColorsFilter() {
  console.log('🧪 Testing Colors Filter API\n');

  const baseURL = 'http://localhost:5001';
  const storeId = '687c9bb0a7b3f2a0831c4675'; // Replace with actual store ID

  try {
    // Test 1: Single color as string
    console.log('🎨 Test 1: Single color as string');
    const response1 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: '#6B7280'
      }
    });
    
    console.log('✅ Response 1:');
    console.log(`   Success: ${response1.data.success}`);
    console.log(`   Products found: ${response1.data.data?.length || 0}`);
    console.log(`   Total items: ${response1.data.pagination?.totalItems || 0}`);
    console.log('');

    // Test 2: Multiple colors as JSON string
    console.log('🎨 Test 2: Multiple colors as JSON string');
    const response2 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: JSON.stringify(['#6B7280', '#135fe8'])
      }
    });
    
    console.log('✅ Response 2:');
    console.log(`   Success: ${response2.data.success}`);
    console.log(`   Products found: ${response2.data.data?.length || 0}`);
    console.log(`   Total items: ${response2.data.pagination?.totalItems || 0}`);
    console.log('');

    // Test 3: No colors filter
    console.log('🎨 Test 3: No colors filter');
    const response3 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc'
      }
    });
    
    console.log('✅ Response 3:');
    console.log(`   Success: ${response3.data.success}`);
    console.log(`   Products found: ${response3.data.data?.length || 0}`);
    console.log(`   Total items: ${response3.data.pagination?.totalItems || 0}`);
    console.log('');

    // Test 4: Invalid JSON (should still work as single color)
    console.log('🎨 Test 4: Invalid JSON (should work as single color)');
    const response4 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: '[#6B7280' // Invalid JSON
      }
    });
    
    console.log('✅ Response 4:');
    console.log(`   Success: ${response4.data.success}`);
    console.log(`   Products found: ${response4.data.data?.length || 0}`);
    console.log(`   Total items: ${response4.data.pagination?.totalItems || 0}`);
    console.log('');

    console.log('🎉 Colors Filter Test Complete!');

  } catch (error) {
    console.log('❌ Test failed:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.errors) {
        console.log('   Validation Errors:');
        error.response.data.errors.forEach(err => {
          console.log(`     - ${err.path}: ${err.msg}`);
        });
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Test the original failing URL
async function testOriginalURL() {
  console.log('\n🧪 Testing Original Failing URL\n');

  const baseURL = 'http://localhost:5001';
  const storeId = '687c9bb0a7b3f2a0831c4675';

  try {
    const response = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: '[#6B7280]' // This was the original failing parameter
      }
    });
    
    console.log('✅ Original URL now works:');
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Products found: ${response.data.data?.length || 0}`);
    console.log(`   Total items: ${response.data.pagination?.totalItems || 0}`);

  } catch (error) {
    console.log('❌ Original URL still failing:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.errors) {
        console.log('   Validation Errors:');
        error.response.data.errors.forEach(err => {
          console.log(`     - ${err.path}: ${err.msg}`);
        });
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Run all tests
async function runTests() {
  try {
    await testColorsFilter();
    await testOriginalURL();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
