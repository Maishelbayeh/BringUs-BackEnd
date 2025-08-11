/**
 * Test Wholesaler Status
 * 
 * This example helps debug wholesaler status issues
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = 'your-store-id';
const USER_ID = 'your-user-id';

/**
 * Test 1: Check wholesaler status
 */
async function checkWholesalerStatus() {
  try {
    console.log('🔍 Checking wholesaler status...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/wholesaler-status/${USER_ID}`
    );

    console.log('✅ Wholesaler status checked successfully');
    console.log('📊 Status Info:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error checking wholesaler status:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Get wholesaler discount
 */
async function getWholesalerDiscount() {
  try {
    console.log('💰 Getting wholesaler discount...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/wholesaler-discount/${USER_ID}`
    );

    console.log('✅ Wholesaler discount retrieved successfully');
    console.log('📊 Discount Info:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ No active wholesaler found for this user');
    } else {
      console.error('❌ Error getting wholesaler discount:', error.response?.data?.message || error.message);
    }
  }
}

/**
 * Test 3: Calculate prices
 */
async function calculatePrices() {
  try {
    console.log('💰 Calculating prices...');
    
    const requestData = {
      userId: USER_ID,
      items: [
        {
          productId: 'product-id-1',
          quantity: 2
        }
      ]
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}/calculate-price`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Price calculation completed');
    console.log('📊 Price Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error calculating prices:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Wholesaler Status Tests\n');
  
  // Test 1: Check status
  console.log('='.repeat(60));
  console.log('TEST 1: Check Wholesaler Status');
  console.log('='.repeat(60));
  await checkWholesalerStatus();
  
  // Test 2: Get discount
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Wholesaler Discount');
  console.log('='.repeat(60));
  await getWholesalerDiscount();
  
  // Test 3: Calculate prices
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Calculate Prices');
  console.log('='.repeat(60));
  await calculatePrices();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Check the console logs above for detailed information');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  checkWholesalerStatus,
  getWholesalerDiscount,
  calculatePrices,
  runTests
};
