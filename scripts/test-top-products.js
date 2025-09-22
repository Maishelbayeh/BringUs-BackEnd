const axios = require('axios');

async function testTopProductsAPI() {
  console.log('🧪 Testing Top Products API\n');

  const baseURL = 'http://localhost:5001';
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

  if (token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please replace YOUR_JWT_TOKEN_HERE with a real token');
    console.log('💡 You can get a token by:');
    console.log('   1. Registering a new user');
    console.log('   2. Logging in with existing user');
    console.log('   3. Copying the token from the response');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test Top Products API
    console.log('📦 Testing Top Products API...');
    const response = await axios.get(`${baseURL}/api/orders/analytics/top-products`, { headers });
    
    console.log('✅ Top Products Response:');
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Found ${response.data.data.length} products`);
    
    if (response.data.data.length > 0) {
      console.log('\n🏆 Top Products:');
      response.data.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.productName || product.productNameAr}`);
        console.log(`      SKU: ${product.productSku}`);
        console.log(`      Quantity Sold: ${product.totalQuantitySold}`);
        console.log(`      Revenue: $${product.totalRevenue}`);
        console.log(`      Orders: ${product.orderCount}`);
        console.log(`      Average Price: $${product.averagePrice?.toFixed(2) || 'N/A'}`);
        if (product.mainImage) {
          console.log(`      Image: ${product.mainImage}`);
        }
        console.log('');
      });
    } else {
      console.log('   No products found - this might mean:');
      console.log('   - No orders exist for this store');
      console.log('   - Orders exist but no products were sold');
      console.log('   - Data structure issue');
    }

    // Test Categories Revenue API
    console.log('\n💰 Testing Categories Revenue API...');
    const response2 = await axios.get(`${baseURL}/api/orders/analytics/categories-revenue`, { headers });
    
    console.log('✅ Categories Revenue Response:');
    console.log(`   Success: ${response2.data.success}`);
    console.log(`   Found ${response2.data.data.length} categories`);
    
    if (response2.data.data.length > 0) {
      console.log('\n📊 Categories Revenue:');
      response2.data.data.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.categoryNameEn || category.categoryNameAr}`);
        console.log(`      Revenue: $${category.totalRevenue}`);
        console.log(`      Quantity: ${category.totalQuantity}`);
        console.log(`      Orders: ${category.orderCount}`);
        console.log('');
      });
    } else {
      console.log('   No categories found - this might mean:');
      console.log('   - No orders exist for this store');
      console.log('   - Orders exist but no categories assigned');
      console.log('   - Data structure issue');
    }

    console.log('\n🎉 Top Products API Test Complete!');

  } catch (error) {
    console.log('❌ Test failed:');
    
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

// Test without authentication (should fail)
async function testWithoutAuth() {
  console.log('\n🧪 Testing Without Authentication\n');

  const baseURL = 'http://localhost:5001';

  try {
    const response = await axios.get(`${baseURL}/api/orders/analytics/top-products`, { timeout: 5000 });
    console.log('⚠️  Unexpected success without authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Run all tests
async function runTests() {
  try {
    await testTopProductsAPI();
    await testWithoutAuth();
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests();
