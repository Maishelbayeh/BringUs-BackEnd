/**
 * Debug Specification Matching Example
 * 
 * This example helps debug specification matching issues by:
 * 1. Testing different specification ID formats
 * 2. Comparing data types
 * 3. Providing detailed logging
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';
const PRODUCT_ID = '68936232169af567de454f75';

/**
 * Test 1: Get product details to see available specifications
 */
async function getProductDetails() {
  try {
    console.log('🔍 Getting product details...');
    
    const response = await axios.get(`${BASE_URL}/orders/store/${STORE_ID}/product/${PRODUCT_ID}/stock-status`);
    
    console.log('✅ Product details retrieved successfully');
    console.log('📊 Product Specifications:', JSON.stringify(response.data.data.specifications, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting product details:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Create order with exact specification format
 */
async function testOrderWithExactSpecifications() {
  try {
    console.log('🛒 Testing order with exact specification format...');
    
    const orderData = {
      guestId: 'guest_1754823490823_dgektt4jfla',
      items: [
        {
          product: PRODUCT_ID,
          quantity: 2
        }
      ],
      cartItems: [
        {
          product: PRODUCT_ID,
          quantity: 2,
          selectedSpecifications: [
            {
              specificationId: '687e1bcdf719f1c3b5813a40',
              valueId: '68979ddc6ff9f1d11982c0e5',
              value: 'Test Value',
              title: 'Test Specification'
            }
          ]
        }
      ],
      shippingAddress: {
        firstName: 'Mai',
        lastName: 'Shelbayeh',
        email: 'guest@example.com',
        phone: '+970592678828',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country',
        zipCode: '12345'
      },
      billingAddress: {
        fullName: 'Mai Shelbayeh',
        firstName: 'Mai',
        lastName: 'Shelbayeh',
        email: 'guest@example.com',
        phone: '+970592678828',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country',
        zipCode: '12345'
      },
      paymentInfo: {
        method: 'credit_card',
        paymentMethodId: '688f4c06b301b0f80cc59cd0',
        status: 'pending'
      },
      shippingInfo: {
        method: 'delivery',
        cost: 70,
        deliveryMethodId: '687debac4ccd1c25c80947d9'
      },
      notes: {
        customer: 'Test order for debugging'
      },
      isGift: false,
      giftMessage: '',
      currency: 'ILS',
      deliveryArea: '687debac4ccd1c25c80947d9'
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}/guest`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Order created successfully');
    console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.log('❌ Order creation failed (expected for debugging)');
    console.log('📝 Error message:', error.response?.data?.message);
    console.log('📝 Full error:', JSON.stringify(error.response?.data, null, 2));
  }
}

/**
 * Test 3: Create order without specifications (should work)
 */
async function testOrderWithoutSpecifications() {
  try {
    console.log('🛒 Testing order without specifications...');
    
    const orderData = {
      guestId: 'guest_1754823490823_dgektt4jfla',
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
          selectedSpecifications: []
        }
      ],
      shippingAddress: {
        firstName: 'Mai',
        lastName: 'Shelbayeh',
        email: 'guest@example.com',
        phone: '+970592678828',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country',
        zipCode: '12345'
      },
      billingAddress: {
        fullName: 'Mai Shelbayeh',
        firstName: 'Mai',
        lastName: 'Shelbayeh',
        email: 'guest@example.com',
        phone: '+970592678828',
        address: 'Test Address',
        city: 'Test City',
        country: 'Test Country',
        zipCode: '12345'
      },
      paymentInfo: {
        method: 'credit_card',
        paymentMethodId: '688f4c06b301b0f80cc59cd0',
        status: 'pending'
      },
      shippingInfo: {
        method: 'delivery',
        cost: 70,
        deliveryMethodId: '687debac4ccd1c25c80947d9'
      },
      notes: {
        customer: 'Test order without specifications'
      },
      isGift: false,
      giftMessage: '',
      currency: 'ILS',
      deliveryArea: '687debac4ccd1c25c80947d9'
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}/guest`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Order without specifications created successfully');
    console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.log('❌ Order creation failed');
    console.log('📝 Error message:', error.response?.data?.message);
  }
}

/**
 * Run all tests
 */
async function runDebugTests() {
  console.log('🚀 Starting Specification Debug Tests\n');
  
  // Test 1: Get product details
  console.log('='.repeat(60));
  console.log('TEST 1: Get Product Details');
  console.log('='.repeat(60));
  await getProductDetails();
  
  // Test 2: Test with specifications (should fail with detailed error)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Test Order with Specifications (Expected to Fail)');
  console.log('='.repeat(60));
  await testOrderWithExactSpecifications();
  
  // Test 3: Test without specifications (should work)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Test Order without Specifications (Should Work)');
  console.log('='.repeat(60));
  await testOrderWithoutSpecifications();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All debug tests completed!');
  console.log('📋 Check the console logs above for detailed specification matching analysis');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDebugTests().catch(console.error);
}

module.exports = {
  getProductDetails,
  testOrderWithExactSpecifications,
  testOrderWithoutSpecifications,
  runDebugTests
};
