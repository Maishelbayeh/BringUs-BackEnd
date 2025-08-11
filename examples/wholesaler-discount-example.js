/**
 * Wholesaler Discount Example
 * 
 * This example demonstrates how to:
 * 1. Get wholesaler discount for a user
 * 2. Apply wholesaler pricing in orders
 * 3. Handle different user roles
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = 'your-store-id';
const USER_ID = 'your-user-id';

/**
 * Example 1: Get wholesaler discount for a user
 */
async function getWholesalerDiscount() {
  try {
    console.log('🔍 Getting wholesaler discount...');
    
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
 * Example 2: Create order with wholesaler pricing
 */
async function createOrderWithWholesalerPricing() {
  try {
    console.log('🛒 Creating order with wholesaler pricing...');
    
    // First, get the wholesaler discount
    const discountInfo = await getWholesalerDiscount();
    
    if (!discountInfo) {
      console.log('❌ User is not a wholesaler, cannot apply wholesaler pricing');
      return;
    }
    
    const orderData = {
      user: USER_ID,
      items: [
        {
          product: 'product-id',
          quantity: 5
        }
      ],
      cartItems: [
        {
          product: 'product-id',
          quantity: 5,
          selectedSpecifications: []
        }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '10001'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '10001'
      },
      paymentInfo: {
        method: 'credit_card',
        cardNumber: '**** **** **** 1234',
        expiryDate: '12/25',
        cvv: '123'
      },
      shippingInfo: {
        method: 'standard',
        cost: 10,
        estimatedDays: 3
      },
      notes: 'Wholesaler order with discount',
      currency: 'USD'
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer your-jwt-token'
        }
      }
    );

    console.log('✅ Order created successfully with wholesaler pricing');
    console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    console.log(`💰 Applied wholesaler discount: ${discountInfo.discountRate}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data?.message || error.message);
  }
}

/**
 * Example 3: Check if user is wholesaler before creating order
 */
async function checkUserRoleAndCreateOrder() {
  try {
    console.log('🔍 Checking user role...');
    
    // Get wholesaler discount to check if user is wholesaler
    const discountInfo = await getWholesalerDiscount();
    
    if (discountInfo) {
      console.log(`✅ User is a verified wholesaler with ${discountInfo.discountRate} discount`);
      console.log(`🏢 Business: ${discountInfo.businessName}`);
      
      // Create order with wholesaler pricing
      await createOrderWithWholesalerPricing();
    } else {
      console.log('ℹ️ User is not a wholesaler, creating regular order...');
      
      // Create regular order without wholesaler pricing
      const orderData = {
        user: USER_ID,
        items: [
          {
            product: 'product-id',
            quantity: 2
          }
        ],
        cartItems: [
          {
            product: 'product-id',
            quantity: 2,
            selectedSpecifications: []
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Main St',
          city: 'New York',
          country: 'USA',
          zipCode: '10001'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          address: '123 Main St',
          city: 'New York',
          country: 'USA',
          zipCode: '10001'
        },
        paymentInfo: {
          method: 'credit_card',
          cardNumber: '**** **** **** 1234',
          expiryDate: '12/25',
          cvv: '123'
        },
        shippingInfo: {
          method: 'standard',
          cost: 10,
          estimatedDays: 3
        },
        notes: 'Regular customer order',
        currency: 'USD'
      };

      const response = await axios.post(
        `${BASE_URL}/orders/store/${STORE_ID}`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer your-jwt-token'
          }
        }
      );

      console.log('✅ Regular order created successfully');
      console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

/**
 * Example 4: Get all wholesaler information
 */
async function getFullWholesalerInfo() {
  try {
    console.log('🔍 Getting full wholesaler information...');
    
    const response = await axios.get(
      `${BASE_URL}/wholesalers/store/${STORE_ID}/${USER_ID}`,
      {
        headers: {
          'Authorization': 'Bearer your-jwt-token'
        }
      }
    );

    console.log('✅ Full wholesaler info retrieved');
    console.log('📊 Wholesaler Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting wholesaler info:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Starting Wholesaler Discount Examples\n');
  
  // Example 1: Get wholesaler discount
  console.log('='.repeat(60));
  console.log('EXAMPLE 1: Get Wholesaler Discount');
  console.log('='.repeat(60));
  await getWholesalerDiscount();
  
  // Example 2: Create order with wholesaler pricing
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 2: Create Order with Wholesaler Pricing');
  console.log('='.repeat(60));
  await createOrderWithWholesalerPricing();
  
  // Example 3: Check user role and create order
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 3: Check User Role and Create Order');
  console.log('='.repeat(60));
  await checkUserRoleAndCreateOrder();
  
  // Example 4: Get full wholesaler info
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 4: Get Full Wholesaler Information');
  console.log('='.repeat(60));
  await getFullWholesalerInfo();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All examples completed!');
  console.log('='.repeat(60));
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  getWholesalerDiscount,
  createOrderWithWholesalerPricing,
  checkUserRoleAndCreateOrder,
  getFullWholesalerInfo,
  runAllExamples
};
