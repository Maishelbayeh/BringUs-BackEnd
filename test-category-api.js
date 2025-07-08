const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '507f1f77bcf86cd799439012'; // Replace with actual store ID

// Test data
const testCategory = {
  nameAr: 'إلكترونيات',
  nameEn: 'Electronics',
  descriptionAr: 'كل ما يتعلق بالأجهزة الإلكترونية',
  descriptionEn: 'All about electronics',
  storeId: STORE_ID,
  isActive: true,
  isFeatured: true,
  sortOrder: 1
};

async function testCategoryAPI() {
  console.log('🧪 Testing Store-Specific Category API...\n');

  try {
    // Test 1: Get all categories for a store
    console.log('1️⃣ Testing GET /api/categories');
    const getAllResponse = await axios.get(`${BASE_URL}/categories?storeId=${STORE_ID}`);
    console.log('✅ Get all categories:', getAllResponse.data);
    console.log('');

    // Test 2: Create a new category
    console.log('2️⃣ Testing POST /api/categories');
    const createResponse = await axios.post(`${BASE_URL}/categories`, testCategory);
    console.log('✅ Create category:', createResponse.data);
    const categoryId = createResponse.data.data._id;
    console.log('');

    // Test 3: Get category by ID
    console.log('3️⃣ Testing GET /api/categories/:id');
    const getByIdResponse = await axios.get(`${BASE_URL}/categories/${categoryId}?storeId=${STORE_ID}`);
    console.log('✅ Get category by ID:', getByIdResponse.data);
    console.log('');

    // Test 4: Get category details
    console.log('4️⃣ Testing GET /api/categories/:id/details');
    const getDetailsResponse = await axios.get(`${BASE_URL}/categories/${categoryId}/details?storeId=${STORE_ID}`);
    console.log('✅ Get category details:', getDetailsResponse.data);
    console.log('');

    // Test 5: Update category
    console.log('5️⃣ Testing PUT /api/categories/:id');
    const updateData = {
      ...testCategory,
      nameEn: 'Updated Electronics',
      descriptionEn: 'Updated electronics description'
    };
    const updateResponse = await axios.put(`${BASE_URL}/categories/${categoryId}`, updateData);
    console.log('✅ Update category:', updateResponse.data);
    console.log('');

    // Test 6: Get category tree
    console.log('6️⃣ Testing GET /api/categories/tree');
    const getTreeResponse = await axios.get(`${BASE_URL}/categories/tree?storeId=${STORE_ID}`);
    console.log('✅ Get category tree:', getTreeResponse.data);
    console.log('');

    // Test 7: Get featured categories
    console.log('7️⃣ Testing GET /api/categories/featured');
    const getFeaturedResponse = await axios.get(`${BASE_URL}/categories/featured?storeId=${STORE_ID}`);
    console.log('✅ Get featured categories:', getFeaturedResponse.data);
    console.log('');

    // Test 8: Delete category
    console.log('8️⃣ Testing DELETE /api/categories/:id');
    const deleteResponse = await axios.delete(`${BASE_URL}/categories/${categoryId}?storeId=${STORE_ID}`);
    console.log('✅ Delete category:', deleteResponse.data);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test store isolation
async function testStoreIsolation() {
  console.log('🔒 Testing Store Isolation...\n');

  const STORE_1_ID = '507f1f77bcf86cd799439012';
  const STORE_2_ID = '507f1f77bcf86cd799439013';

  try {
    // Create category for store 1
    const category1 = {
      nameAr: 'ملابس',
      nameEn: 'Clothing',
      storeId: STORE_1_ID,
      isActive: true
    };

    const create1Response = await axios.post(`${BASE_URL}/categories`, category1);
    const category1Id = create1Response.data.data._id;
    console.log('✅ Created category for store 1:', create1Response.data.data.nameEn);

    // Create category for store 2
    const category2 = {
      nameAr: 'أحذية',
      nameEn: 'Shoes',
      storeId: STORE_2_ID,
      isActive: true
    };

    const create2Response = await axios.post(`${BASE_URL}/categories`, category2);
    const category2Id = create2Response.data.data._id;
    console.log('✅ Created category for store 2:', create2Response.data.data.nameEn);

    // Try to get store 1's category from store 2's context
    console.log('\n🔍 Testing isolation: Getting store 1 category from store 2 context...');
    try {
      await axios.get(`${BASE_URL}/categories/${category1Id}?storeId=${STORE_2_ID}`);
      console.log('❌ FAILED: Should not be able to access store 1 category from store 2');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ PASSED: Store isolation working - cannot access store 1 category from store 2');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Get categories for each store
    const store1Categories = await axios.get(`${BASE_URL}/categories?storeId=${STORE_1_ID}`);
    const store2Categories = await axios.get(`${BASE_URL}/categories?storeId=${STORE_2_ID}`);

    console.log('\n📊 Store 1 categories count:', store1Categories.data.count);
    console.log('📊 Store 2 categories count:', store2Categories.data.count);

    // Clean up
    await axios.delete(`${BASE_URL}/categories/${category1Id}?storeId=${STORE_1_ID}`);
    await axios.delete(`${BASE_URL}/categories/${category2Id}?storeId=${STORE_2_ID}`);
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Store isolation test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Category API Tests...\n');
  
  await testCategoryAPI();
  console.log('\n' + '='.repeat(50) + '\n');
  await testStoreIsolation();
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCategoryAPI, testStoreIsolation }; 