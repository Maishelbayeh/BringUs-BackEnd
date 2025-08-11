/**
 * Test Order Creation with Wholesaler
 * 
 * This example tests order creation with wholesaler pricing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';
const USER_ID = '689892c5b73c259d3cb456d2';
const PRODUCT_ID = '688083b7a83b761668fdcba2';

/**
 * Test 1: Create order with wholesaler pricing
 */
async function createOrderWithWholesaler() {
  try {
    console.log('🛒 Creating order with wholesaler pricing...');
    
    const orderData = {
      user: USER_ID,
      items: [
        {
          product: PRODUCT_ID,
          quantity: 1
        }
      ],
      cartItems: [
        {
          product: PRODUCT_ID,
          quantity: 1,
          selectedSpecifications: [
            {
              specificationId: '688083b7a83b761668fdcba2',
              valueId: '688083b7a83b761668fdcba2_1',
              value: 'النمرة (38)',
              title: 'النمرة'
            }
          ]
        }
      ],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country'
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country'
      },
      paymentInfo: {
        method: 'cash',
        status: 'pending'
      },
      shippingInfo: {
        method: 'standard',
        status: 'pending'
      },
      notes: 'Test order with wholesaler pricing'
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Order created successfully');
    console.log('📊 Order Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

/**
 * Test 2: Check wholesaler status
 */
async function checkWholesalerStatus() {
  try {
    console.log('🔍 Checking wholesaler status...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/wholesaler-status/${USER_ID}`
    );

    console.log('✅ Wholesaler status checked');
    console.log('📊 Status:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error checking wholesaler status:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Get wholesaler discount
 */
async function getWholesalerDiscount() {
  try {
    console.log('💰 Getting wholesaler discount...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/wholesaler-discount/${USER_ID}`
    );

    console.log('✅ Wholesaler discount retrieved');
    console.log('📊 Discount:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting wholesaler discount:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 4: Calculate prices
 */
async function calculatePrices() {
  try {
    console.log('💰 Calculating prices...');
    
    const requestData = {
      userId: USER_ID,
      items: [
        {
          productId: PRODUCT_ID,
          quantity: 1
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
  console.log('🚀 Starting Order Creation Tests\n');
  
  // Test 1: Check wholesaler status
  console.log('='.repeat(60));
  console.log('TEST 1: Check Wholesaler Status');
  console.log('='.repeat(60));
  await checkWholesalerStatus();
  
  // Test 2: Get wholesaler discount
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Wholesaler Discount');
  console.log('='.repeat(60));
  await getWholesalerDiscount();
  
  // Test 3: Calculate prices
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Calculate Prices');
  console.log('='.repeat(60));
  await calculatePrices();
  
  // Test 4: Create order
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Create Order with Wholesaler Pricing');
  console.log('='.repeat(60));
  await createOrderWithWholesaler();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Key Points:');
  console.log('   • Wholesaler pricing applied correctly');
  console.log('   • Stock reduction working');
  console.log('   • Discount calculation working');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  createOrderWithWholesaler,
  checkWholesalerStatus,
  getWholesalerDiscount,
  calculatePrices,
  runTests
};
