/**
 * Wholesaler Pricing Example
 * 
 * This example demonstrates the enhanced wholesaler pricing system:
 * 1. Get wholesaler discount
 * 2. Calculate prices with compareAtPrice
 * 3. Create orders with automatic pricing
 * 4. Use the new calculate-price API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = 'your-store-id';
const USER_ID = 'your-user-id';

/**
 * Example 1: Get wholesaler discount
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
 * Example 2: Calculate prices with wholesaler discount
 */
async function calculatePricesWithWholesalerDiscount() {
  try {
    console.log('💰 Calculating prices with wholesaler discount...');
    
    const requestData = {
      userId: USER_ID,
      items: [
        {
          productId: 'product-id-1',
          quantity: 2
        },
        {
          productId: 'product-id-2',
          quantity: 1
        },
        {
          productId: 'product-id-3',
          quantity: 5
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

    console.log('✅ Price calculation completed successfully');
    console.log('📊 Price Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error calculating prices:', error.response?.data?.message || error.message);
  }
}

/**
 * Example 3: Calculate prices for guest user (no wholesaler discount)
 */
async function calculatePricesForGuest() {
  try {
    console.log('💰 Calculating prices for guest user...');
    
    const requestData = {
      items: [
        {
          productId: 'product-id-1',
          quantity: 1
        },
        {
          productId: 'product-id-2',
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

    console.log('✅ Price calculation for guest completed');
    console.log('📊 Price Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error calculating prices for guest:', error.response?.data?.message || error.message);
  }
}

/**
 * Example 4: Create order with automatic wholesaler pricing
 */
async function createOrderWithAutomaticPricing() {
  try {
    console.log('🛒 Creating order with automatic wholesaler pricing...');
    
    const orderData = {
      user: USER_ID,
      items: [
        {
          product: 'product-id-1',
          quantity: 3
        },
        {
          product: 'product-id-2',
          quantity: 2
        }
      ],
      cartItems: [
        {
          product: 'product-id-1',
          quantity: 3,
          selectedSpecifications: []
        },
        {
          product: 'product-id-2',
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
      notes: 'Order with automatic wholesaler pricing',
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

    console.log('✅ Order created successfully with automatic pricing');
    console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data?.message || error.message);
  }
}

/**
 * Example 5: Compare regular vs wholesaler pricing
 */
async function comparePricing() {
  try {
    console.log('⚖️ Comparing regular vs wholesaler pricing...');
    
    const items = [
      {
        productId: 'product-id-1',
        quantity: 1
      }
    ];
    
    // Calculate for regular user (no userId)
    console.log('\n📊 Regular User Pricing:');
    const regularPricing = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}/calculate-price`,
      { items },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Regular pricing:', JSON.stringify(regularPricing.data.data, null, 2));
    
    // Calculate for wholesaler user
    console.log('\n📊 Wholesaler User Pricing:');
    const wholesalerPricing = await axios.post(
      `${BASE_URL}/orders/store/${STORE_ID}/calculate-price`,
      { userId: USER_ID, items },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Wholesaler pricing:', JSON.stringify(wholesalerPricing.data.data, null, 2));
    
    // Compare prices
    const regularSubtotal = regularPricing.data.data.subtotal;
    const wholesalerSubtotal = wholesalerPricing.data.data.subtotal;
    const savings = regularSubtotal - wholesalerSubtotal;
    const savingsPercentage = ((savings / regularSubtotal) * 100).toFixed(2);
    
    console.log('\n💰 Price Comparison Summary:');
    console.log(`Regular Price: $${regularSubtotal}`);
    console.log(`Wholesaler Price: $${wholesalerSubtotal}`);
    console.log(`Savings: $${savings} (${savingsPercentage}%)`);
    
  } catch (error) {
    console.error('❌ Error comparing pricing:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Starting Wholesaler Pricing Examples\n');
  
  // Example 1: Get wholesaler discount
  console.log('='.repeat(60));
  console.log('EXAMPLE 1: Get Wholesaler Discount');
  console.log('='.repeat(60));
  await getWholesalerDiscount();
  
  // Example 2: Calculate prices with wholesaler discount
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 2: Calculate Prices with Wholesaler Discount');
  console.log('='.repeat(60));
  await calculatePricesWithWholesalerDiscount();
  
  // Example 3: Calculate prices for guest
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 3: Calculate Prices for Guest User');
  console.log('='.repeat(60));
  await calculatePricesForGuest();
  
  // Example 4: Create order with automatic pricing
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 4: Create Order with Automatic Pricing');
  console.log('='.repeat(60));
  await createOrderWithAutomaticPricing();
  
  // Example 5: Compare pricing
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 5: Compare Regular vs Wholesaler Pricing');
  console.log('='.repeat(60));
  await comparePricing();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All examples completed!');
  console.log('📋 Key Features:');
  console.log('   • Automatic wholesaler pricing using compareAtPrice');
  console.log('   • Price calculation API for preview');
  console.log('   • Support for both regular and wholesaler users');
  console.log('   • Detailed pricing breakdown');
  console.log('='.repeat(60));
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  getWholesalerDiscount,
  calculatePricesWithWholesalerDiscount,
  calculatePricesForGuest,
  createOrderWithAutomaticPricing,
  comparePricing,
  runAllExamples
};
