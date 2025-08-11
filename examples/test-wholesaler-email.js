/**
 * Test Wholesaler by Email
 * 
 * This example tests searching for wholesaler using email
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = 'your-store-id';
const USER_EMAIL = 'wholesaler@example.com';

/**
 * Test 1: Get wholesaler discount by email
 */
async function getWholesalerDiscountByEmail() {
  try {
    console.log('🔍 Getting wholesaler discount by email...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/wholesaler-discount-email/${encodeURIComponent(USER_EMAIL)}`
    );

    console.log('✅ Wholesaler discount retrieved successfully');
    console.log('📊 Discount Info:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ No active wholesaler found for this email');
    } else {
      console.error('❌ Error getting wholesaler discount by email:', error.response?.data?.message || error.message);
    }
  }
}

/**
 * Test 2: Calculate prices with email
 */
async function calculatePricesWithEmail() {
  try {
    console.log('💰 Calculating prices with email...');
    
    const requestData = {
      email: USER_EMAIL, // يمكن إضافة email في request body
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
 * Test 3: Direct database query simulation
 */
async function simulateDirectQuery() {
  try {
    console.log('🔍 Simulating direct database query...');
    
    // هذا مثال على كيفية البحث المباشر في قاعدة البيانات
    console.log('📋 Direct query would be:');
    console.log(`Wholesaler.findOne({
      email: "${USER_EMAIL}",
      store: "${STORE_ID}",
      status: "Active",
      isVerified: true
    })`);
    
    // استدعاء API للتحقق من النتيجة
    const discountInfo = await getWholesalerDiscountByEmail();
    
    if (discountInfo) {
      console.log('✅ Direct query would return:', {
        discount: discountInfo.discount,
        businessName: discountInfo.businessName,
        isVerified: discountInfo.isVerified
      });
    } else {
      console.log('❌ Direct query would return: null');
    }
    
  } catch (error) {
    console.error('❌ Error in simulation:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Wholesaler Email Tests\n');
  
  // Test 1: Get discount by email
  console.log('='.repeat(60));
  console.log('TEST 1: Get Wholesaler Discount by Email');
  console.log('='.repeat(60));
  await getWholesalerDiscountByEmail();
  
  // Test 2: Calculate prices
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Calculate Prices with Email');
  console.log('='.repeat(60));
  await calculatePricesWithEmail();
  
  // Test 3: Direct query simulation
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Direct Query Simulation');
  console.log('='.repeat(60));
  await simulateDirectQuery();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Key Points:');
  console.log('   • Search by email instead of userId');
  console.log('   • Direct database query simulation');
  console.log('   • API endpoint: /wholesaler-discount-email/:email');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  getWholesalerDiscountByEmail,
  calculatePricesWithEmail,
  simulateDirectQuery,
  runTests
};
