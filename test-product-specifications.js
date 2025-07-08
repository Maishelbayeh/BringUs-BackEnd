const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '686a719956a82bfcc93a2e2d'; // Store ID المحدد

async function testProductSpecifications() {
  console.log('🧪 Testing Product Specifications API...\n');

  try {
    // Test 1: Get specifications by store
    console.log('1. Testing GET /meta/product-specifications/by-store');
    const getResponse = await axios.get(`${BASE_URL}/meta/product-specifications/by-store?storeId=${STORE_ID}`);
    console.log('✅ GET Response:', getResponse.data);
    console.log('');

    // Test 2: Create a new specification
    console.log('2. Testing POST /meta/product-specifications');
    const createData = {
      descriptionAr: 'طويل',
      descriptionEn: 'Long',
      category: null, // التصنيف اختياري الآن
      store: STORE_ID,
      sortOrder: 1
    };
    
    const createResponse = await axios.post(`${BASE_URL}/meta/product-specifications`, createData);
    console.log('✅ CREATE Response:', createResponse.data);
    const createdId = createResponse.data._id;
    console.log('');

    // Test 3: Get specification by ID
    console.log('3. Testing GET /meta/product-specifications/:id');
    const getByIdResponse = await axios.get(`${BASE_URL}/meta/product-specifications/${createdId}`);
    console.log('✅ GET BY ID Response:', getByIdResponse.data);
    console.log('');

    // Test 4: Update specification
    console.log('4. Testing PUT /meta/product-specifications/:id');
    const updateData = {
      descriptionAr: 'طويل جداً',
      descriptionEn: 'Very Long',
      category: null, // التصنيف اختياري الآن
      store: STORE_ID,
      sortOrder: 2
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/meta/product-specifications/${createdId}`, updateData);
    console.log('✅ UPDATE Response:', updateResponse.data);
    console.log('');

    // Test 5: Delete specification
    console.log('5. Testing DELETE /meta/product-specifications/:id');
    const deleteResponse = await axios.delete(`${BASE_URL}/meta/product-specifications/${createdId}`);
    console.log('✅ DELETE Response:', deleteResponse.data);
    console.log('');

    console.log('🎉 All Product Specifications API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProductSpecifications(); 