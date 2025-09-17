const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/products';
const STORE_ID = '507f1f77bcf86cd799439012'; // Replace with actual store ID

async function testAlmostSoldProducts() {
  try {
    console.log('🧪 Testing Almost Sold Products API...\n');

    // Test 1: Get almost sold products with default parameters
    console.log('📋 Test 1: Get almost sold products (default parameters)');
    const response1 = await axios.get(`${BASE_URL}/${STORE_ID}/almost-sold`);
    
    console.log('✅ Status:', response1.status);
    console.log('📊 Response:', {
      success: response1.data.success,
      totalItems: response1.data.pagination?.totalItems,
      currentPage: response1.data.pagination?.currentPage,
      totalPages: response1.data.pagination?.totalPages,
      summary: response1.data.summary
    });
    console.log('📦 Products found:', response1.data.data?.length || 0);
    
    if (response1.data.data?.length > 0) {
      console.log('🔍 First product sample:', {
        name: response1.data.data[0].nameEn,
        stock: response1.data.data[0].stock,
        availableQuantity: response1.data.data[0].availableQuantity,
        lowStockThreshold: response1.data.data[0].lowStockThreshold,
        isAlmostSold: response1.data.data[0].isAlmostSold,
        stockDifference: response1.data.data[0].stockDifference
      });
    }
    console.log('');

    // Test 2: Get almost sold products with custom threshold
    console.log('📋 Test 2: Get almost sold products (custom threshold = 10)');
    const response2 = await axios.get(`${BASE_URL}/${STORE_ID}/almost-sold?threshold=10&limit=5`);
    
    console.log('✅ Status:', response2.status);
    console.log('📊 Response:', {
      success: response2.data.success,
      totalItems: response2.data.pagination?.totalItems,
      threshold: response2.data.summary?.threshold,
      message: response2.data.summary?.message
    });
    console.log('📦 Products found:', response2.data.data?.length || 0);
    console.log('');

    // Test 3: Get almost sold products with sorting
    console.log('📋 Test 3: Get almost sold products (sorted by stock desc)');
    const response3 = await axios.get(`${BASE_URL}/${STORE_ID}/almost-sold?sortBy=stock&sortOrder=desc&limit=3`);
    
    console.log('✅ Status:', response3.status);
    console.log('📊 Response:', {
      success: response3.data.success,
      totalItems: response3.data.pagination?.totalItems
    });
    console.log('📦 Products found:', response3.data.data?.length || 0);
    
    if (response3.data.data?.length > 0) {
      console.log('🔍 Stock levels (descending):');
      response3.data.data.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.nameEn}: Stock=${product.stock}, Available=${product.availableQuantity}, Threshold=${product.lowStockThreshold}`);
      });
    }
    console.log('');

    // Test 4: Get almost sold products with pagination
    console.log('📋 Test 4: Get almost sold products (page 2, limit 2)');
    const response4 = await axios.get(`${BASE_URL}/${STORE_ID}/almost-sold?page=2&limit=2`);
    
    console.log('✅ Status:', response4.status);
    console.log('📊 Response:', {
      success: response4.data.success,
      currentPage: response4.data.pagination?.currentPage,
      totalPages: response4.data.pagination?.totalPages,
      hasNextPage: response4.data.pagination?.hasNextPage,
      hasPrevPage: response4.data.pagination?.hasPrevPage
    });
    console.log('📦 Products found:', response4.data.data?.length || 0);
    console.log('');

    // Test 5: Test with invalid store ID
    console.log('📋 Test 5: Test with invalid store ID');
    try {
      await axios.get(`${BASE_URL}/invalid-store-id/almost-sold`);
    } catch (error) {
      console.log('✅ Expected error caught:', error.response?.status);
      console.log('📝 Error message:', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testAlmostSoldProducts();
