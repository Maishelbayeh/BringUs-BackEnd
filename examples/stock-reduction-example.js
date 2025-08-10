/**
 * Example demonstrating enhanced stock reduction functionality
 * This example shows how the system now reduces stock from both:
 * 1. General product stock (product.stock)
 * 2. Specific specification quantities (product.specificationValues[].quantity)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Example product with specifications
const exampleProduct = {
  nameEn: 'Test Product with Specifications',
  nameAr: 'منتج تجريبي مع مواصفات',
  price: 100,
  stock: 50, // General stock
  specificationValues: [
    {
      specificationId: 'spec1',
      valueId: 'size_large',
      value: 'Large',
      title: 'Size',
      quantity: 20, // Specific quantity for Large size
      price: 0
    },
    {
      specificationId: 'spec1',
      valueId: 'size_medium',
      value: 'Medium',
      title: 'Size',
      quantity: 15, // Specific quantity for Medium size
      price: 0
    },
    {
      specificationId: 'spec2',
      valueId: 'color_red',
      value: 'Red',
      title: 'Color',
      quantity: 25, // Specific quantity for Red color
      price: 0
    }
  ]
};

// Example order with specifications
const exampleOrder = {
  storeId: 'your-store-id',
  guestId: 'guest-123',
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
      selectedSpecifications: [
        {
          specificationId: 'spec1',
          valueId: 'size_large',
          value: 'Large',
          title: 'Size'
        },
        {
          specificationId: 'spec2',
          valueId: 'color_red',
          value: 'Red',
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
    country: 'USA'
  }
};

/**
 * Create a guest order with specifications
 * This will reduce stock from both general stock and specific specifications
 */
async function createOrderWithSpecifications() {
  try {
    console.log('🛒 Creating order with specifications...');
    
    const response = await axios.post(
      `${BASE_URL}/orders/store/${exampleOrder.storeId}/guest`,
      exampleOrder,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': exampleOrder.guestId
        }
      }
    );

    console.log('✅ Order created successfully!');
    console.log('📊 Order details:', response.data);
    
    // The system will now:
    // 1. Reduce general stock from 50 to 45
    // 2. Reduce Large size quantity from 20 to 15
    // 3. Reduce Red color quantity from 25 to 20
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test stock validation with insufficient specification quantity
 */
async function testInsufficientSpecificationStock() {
  try {
    console.log('🧪 Testing insufficient specification stock...');
    
    const orderWithLargeQuantity = {
      ...exampleOrder,
      items: [
        {
          product: 'product-id',
          quantity: 30 // More than available in any specification
        }
      ],
      cartItems: [
        {
          product: 'product-id',
          quantity: 30,
          selectedSpecifications: [
            {
              specificationId: 'spec1',
              valueId: 'size_large',
              value: 'Large',
              title: 'Size'
            }
          ]
        }
      ]
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${orderWithLargeQuantity.storeId}/guest`,
      orderWithLargeQuantity,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': orderWithLargeQuantity.guestId
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
 * Test stock validation with insufficient general stock
 */
async function testInsufficientGeneralStock() {
  try {
    console.log('🧪 Testing insufficient general stock...');
    
    const orderWithLargeQuantity = {
      ...exampleOrder,
      items: [
        {
          product: 'product-id',
          quantity: 60 // More than general stock (50)
        }
      ],
      cartItems: [
        {
          product: 'product-id',
          quantity: 60,
          selectedSpecifications: []
        }
      ]
    };

    const response = await axios.post(
      `${BASE_URL}/orders/store/${orderWithLargeQuantity.storeId}/guest`,
      orderWithLargeQuantity,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': orderWithLargeQuantity.guestId
        }
      }
    );

    console.log('❌ This should have failed!');
  } catch (error) {
    console.log('✅ Correctly rejected order with insufficient general stock');
    console.log('📝 Error message:', error.response?.data?.message);
  }
}

/**
 * Main function to run all examples
 */
async function runExamples() {
  console.log('🚀 Starting stock reduction examples...\n');
  
  try {
    // Test 1: Create order with specifications
    await createOrderWithSpecifications();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Test insufficient specification stock
    await testInsufficientSpecificationStock();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Test insufficient general stock
    await testInsufficientGeneralStock();
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('🎉 All examples completed!');
    
  } catch (error) {
    console.error('💥 Example failed:', error.message);
  }
}

// Export functions for use in other files
module.exports = {
  createOrderWithSpecifications,
  testInsufficientSpecificationStock,
  testInsufficientGeneralStock,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
