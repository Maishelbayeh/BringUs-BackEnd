const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Example store ID (you need to replace this with actual store ID)
const STORE_ID = 'YOUR_STORE_ID_HERE';

// Example categories for a specific store
const storeCategories = [
  {
    nameAr: "إلكترونيات",
    nameEn: "Electronics",
    slug: "electronics",
    descriptionAr: "كل ما يتعلق بالأجهزة الإلكترونية",
    descriptionEn: "All about electronics",
    store: STORE_ID,
    level: 0,
    sortOrder: 1,
    isActive: true
  },
  {
    nameAr: "هواتف ذكية",
    nameEn: "Smartphones", 
    slug: "smartphones",
    descriptionAr: "جميع أنواع الهواتف الذكية",
    descriptionEn: "All types of smartphones",
    store: STORE_ID,
    parent: null, // Will be set after parent creation
    level: 1,
    sortOrder: 1,
    isActive: true
  },
  {
    nameAr: "لابتوبات",
    nameEn: "Laptops",
    slug: "laptops",
    descriptionAr: "أجهزة الكمبيوتر المحمولة", 
    descriptionEn: "Portable computers",
    store: STORE_ID,
    parent: null, // Will be set after parent creation
    level: 1,
    sortOrder: 2,
    isActive: true
  }
];

async function createStoreCategories() {
  try {
    console.log('🏪 Creating categories for store:', STORE_ID, '\n');
    
    // First, create the main category
    console.log('1. Creating main category...');
    const mainCategoryResponse = await axios.post(`${API_BASE_URL}/meta/categories`, storeCategories[0]);
    const mainCategoryId = mainCategoryResponse.data._id;
    console.log('✅ Main category created:', mainCategoryResponse.data.nameEn);
    
    // Then create sub-categories
    for (let i = 1; i < storeCategories.length; i++) {
      const category = {
        ...storeCategories[i],
        parent: mainCategoryId
      };
      
      console.log(`\n${i + 1}. Creating sub-category: ${category.nameEn}...`);
      const response = await axios.post(`${API_BASE_URL}/meta/categories`, category);
      console.log('✅ Sub-category created:', response.data.nameEn);
    }
    
    // Get all categories for this store
    console.log('\n📋 Getting all categories for store...');
    const allCategoriesResponse = await axios.get(`${API_BASE_URL}/meta/categories?storeId=${STORE_ID}`);
    console.log('✅ Store categories:', allCategoriesResponse.data.length, 'categories found');
    
    console.log('\n🎉 Store categories created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Instructions
console.log('📝 Instructions:');
console.log('1. Replace STORE_ID with your actual store ID');
console.log('2. Make sure your backend server is running');
console.log('3. Run: node examples/store-categories.js\n');

// Uncomment to run
// createStoreCategories();

module.exports = { createStoreCategories }; 