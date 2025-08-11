/**
 * Enhanced Stock Management Example
 * 
 * This example demonstrates the improved stock management system that:
 * 1. Validates stock for both general stock and specifications
 * 2. Reduces stock from both general stock and specifications
 * 3. Provides detailed logging and error handling
 * 4. Includes a new API endpoint for stock status monitoring
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const STORE_ID = 'your-store-id';
const PRODUCT_ID = 'your-product-id';

/**
 * Example product with specifications
 */
const exampleProduct = {
  nameEn: 'Smartphone X',
  nameAr: 'هاتف ذكي إكس',
  stock: 50, // General stock
  soldCount: 10,
  lowStockThreshold: 5,
  specificationValues: [
    {
      specificationId: 'spec1',
      valueId: 'color_black',
      value: 'Black',
      title: 'Color',
      quantity: 20, // Specific stock for black color
      price: 0
    },
    {
      specificationId: 'spec1',
      valueId: 'color_white',
      value: 'White',
      title: 'Color',
      quantity: 15, // Specific stock for white color
      price: 0
    },
    {
      specificationId: 'spec2',
      valueId: 'storage_128gb',
      value: '128GB',
      title: 'Storage',
      quantity: 25, // Specific stock for 128GB
      price: 0
    },
    {
      specificationId: 'spec2',
      valueId: 'storage_256gb',
      value: '256GB',
      title: 'Storage',
      quantity: 10, // Specific stock for 256GB
      price: 50
    }
  ]
};

/**
 * Test 1: Get detailed stock status
 */
async function testGetStockStatus() {
  try {
    console.log('🔍 Testing stock status API...');
    
    const response = await axios.get(
      `${BASE_URL}/orders/store/${STORE_ID}/product/${PRODUCT_ID}/stock-status`
    );

    console.log('✅ Stock status retrieved successfully');
    console.log('📊 Stock Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting stock status:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Create order with specifications
 */
async function testCreateOrderWithSpecifications() {
  try {
    console.log('🛒 Testing order creation with specifications...');
    
    const orderData = {
      user: 'user-id',
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
              specificationId: 'spec1',
              valueId: 'color_black',
              value: 'Black',
              title: 'Color'
            },
            {
              specificationId: 'spec2',
              valueId: 'storage_128gb',
              value: '128GB',
              title: 'Storage'
            }
          ]
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
      notes: 'Test order with specifications',
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

    console.log('✅ Order created successfully');
    console.log('📦 Order Details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Test insufficient stock validation
 */
async function testInsufficientStock() {
  try {
    console.log('⚠️ Testing insufficient stock validation...');
    
    const orderData = {
      user: 'user-id',
      items: [
        {
          product: PRODUCT_ID,
          quantity: 100 // More than available stock
        }
      ],
      cartItems: [
        {
          product: PRODUCT_ID,
          quantity: 100,
          selectedSpecifications: [
            {
              specificationId: 'spec1',
              valueId: 'color_white',
              value: 'White',
              title: 'Color'
            }
          ]
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

    console.log('❌ This should have failed!');
  } catch (error) {
    console.log('✅ Correctly rejected order with insufficient stock');
    console.log('📝 Error message:', error.response?.data?.message);
  }
}

/**
 * Test 4: Test specification not found
 */
async function testSpecificationNotFound() {
  try {
    console.log('🔍 Testing specification not found...');
    
    const orderData = {
      user: 'user-id',
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
              specificationId: 'invalid-spec',
              valueId: 'invalid-value',
              value: 'Invalid',
              title: 'Invalid'
            }
          ]
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

    console.log('❌ This should have failed!');
  } catch (error) {
    console.log('✅ Correctly rejected order with invalid specification');
    console.log('📝 Error message:', error.response?.data?.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Enhanced Stock Management Tests\n');
  
  // Test 1: Get stock status
  await testGetStockStatus();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Create order with specifications
  await testCreateOrderWithSpecifications();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Test insufficient stock
  await testInsufficientStock();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Test specification not found
  await testSpecificationNotFound();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGetStockStatus,
  testCreateOrderWithSpecifications,
  testInsufficientStock,
  testSpecificationNotFound,
  runAllTests
};

