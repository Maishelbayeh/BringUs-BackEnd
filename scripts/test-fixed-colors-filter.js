const axios = require('axios');

async function testFixedColorsFilter() {
  console.log('🧪 Testing Fixed Colors Filter API\n');

  const baseURL = 'http://localhost:5001';
  const storeId = '687c9bb0a7b3f2a0831c4675'; // Replace with actual store ID

  try {
    // Test 1: Single color as string (the original failing case)
    console.log('🎨 Test 1: Single color as string (#6B7280)');
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

    // Test 3: No colors filter (baseline)
    console.log('🎨 Test 3: No colors filter (baseline)');
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

    // Test 4: Different color format
    console.log('🎨 Test 4: Different color format (rgb)');
    const response4 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: 'rgb(107, 114, 128)'
      }
    });
    
    console.log('✅ Response 4:');
    console.log(`   Success: ${response4.data.success}`);
    console.log(`   Products found: ${response4.data.data?.length || 0}`);
    console.log(`   Total items: ${response4.data.pagination?.totalItems || 0}`);
    console.log('');

    // Test 5: Combined filters (colors + category)
    console.log('🎨 Test 5: Combined filters (colors + category)');
    const response5 = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: '#6B7280',
        category: '687df6d24ccd1c25c80949ac' // Kids Clothing
      }
    });
    
    console.log('✅ Response 5:');
    console.log(`   Success: ${response5.data.success}`);
    console.log(`   Products found: ${response5.data.data?.length || 0}`);
    console.log(`   Total items: ${response5.data.pagination?.totalItems || 0}`);
    console.log('');

    console.log('🎉 Fixed Colors Filter Test Complete!');

  } catch (error) {
    console.log('❌ Test failed:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
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

// Test the exact original failing URL
async function testOriginalFailingURL() {
  console.log('\n🧪 Testing Original Failing URL\n');

  const baseURL = 'http://localhost:5001';
  const storeId = '687c9bb0a7b3f2a0831c4675';

  try {
    const response = await axios.get(`${baseURL}/api/products/${storeId}/without-variants`, {
      params: {
        page: 1,
        limit: 10,
        sort: 'name_asc',
        colors: '#6B7280' // This was the original failing parameter
      }
    });
    
    console.log('✅ Original URL now works:');
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Products found: ${response.data.data?.length || 0}`);
    console.log(`   Total items: ${response.data.pagination?.totalItems || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📦 Sample Products:');
      response.data.data.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.nameEn || product.nameAr}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      Colors: ${product.colors || 'No colors'}`);
        console.log(`      Categories: ${product.category?.nameEn || 'No category'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.log('❌ Original URL still failing:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Run all tests
async function runTests() {
  try {
    await testFixedColorsFilter();
    await testOriginalFailingURL();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
