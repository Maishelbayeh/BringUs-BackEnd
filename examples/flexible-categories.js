const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Example store ID
const STORE_ID = 'YOUR_STORE_ID_HERE';

// Example structure showing categories with both children and products
const categoryStructure = [
  // Level 0: Electronics (can have products directly)
  {
    nameAr: "إلكترونيات",
    nameEn: "Electronics",
    slug: "electronics",
    store: STORE_ID,
    level: 0,
    products: [
      { nameEn: "Universal Charger", price: 25 },
      { nameEn: "Power Bank", price: 50 }
    ]
  },
  // Level 1: Smartphones (can have products AND children)
  {
    nameAr: "هواتف ذكية",
    nameEn: "Smartphones",
    slug: "smartphones", 
    store: STORE_ID,
    level: 1,
    products: [
      { nameEn: "Phone Case Universal", price: 15 },
      { nameEn: "Screen Protector", price: 10 }
    ],
    children: [
      // Level 2: iPhone (can have products AND children)
      {
        nameAr: "آيفون",
        nameEn: "iPhone",
        slug: "iphone",
        store: STORE_ID,
        level: 2,
        products: [
          { nameEn: "iPhone Charger Cable", price: 20 },
          { nameEn: "iPhone Case", price: 25 }
        ],
        children: [
          // Level 3: iPhone 15 (can have products AND children)
          {
            nameAr: "آيفون 15",
            nameEn: "iPhone 15",
            slug: "iphone-15",
            store: STORE_ID,
            level: 3,
            products: [
              { nameEn: "iPhone 15 Pro Max 256GB", price: 1200 },
              { nameEn: "iPhone 15 Case", price: 30 }
            ],
            children: [
              // Level 4: iPhone 15 Pro (can have products)
              {
                nameAr: "آيفون 15 برو",
                nameEn: "iPhone 15 Pro",
                slug: "iphone-15-pro",
                store: STORE_ID,
                level: 4,
                products: [
                  { nameEn: "iPhone 15 Pro 128GB", price: 1000 },
                  { nameEn: "iPhone 15 Pro Case", price: 35 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

async function createFlexibleCategoryStructure() {
  try {
    console.log('🌳 Creating flexible category structure...\n');
    
    const createdCategories = {};
    
    // Recursive function to create categories and their children
    const createCategoryWithChildren = async (categoryData, parentId = null) => {
      const categoryToCreate = {
        nameAr: categoryData.nameAr,
        nameEn: categoryData.nameEn,
        slug: categoryData.slug,
        store: categoryData.store,
        level: categoryData.level,
        parent: parentId
      };
      
      console.log(`📁 Creating category: ${categoryData.nameEn} (Level ${categoryData.level})`);
      
      const response = await axios.post(`${API_BASE_URL}/meta/categories`, categoryToCreate);
      const categoryId = response.data._id;
      createdCategories[categoryData.slug] = categoryId;
      
      console.log(`✅ Created: ${categoryData.nameEn} (ID: ${categoryId})`);
      
      // Create products for this category if any
      if (categoryData.products && categoryData.products.length > 0) {
        console.log(`📦 Adding ${categoryData.products.length} products to ${categoryData.nameEn}...`);
        
        // Note: You would need to implement product creation here
        // For now, we'll just log the products
        categoryData.products.forEach(product => {
          console.log(`   - ${product.nameEn} ($${product.price})`);
        });
      }
      
      // Create children categories
      if (categoryData.children && categoryData.children.length > 0) {
        console.log(`👶 Creating ${categoryData.children.length} children for ${categoryData.nameEn}...`);
        
        for (const child of categoryData.children) {
          await createCategoryWithChildren(child, categoryId);
        }
      }
      
      return categoryId;
    };
    
    // Create the structure
    for (const category of categoryStructure) {
      await createCategoryWithChildren(category);
    }
    
    console.log('\n🎉 Flexible category structure created successfully!');
    
    // Test the new endpoints
    console.log('\n🧪 Testing new endpoints...');
    
    // Test category details endpoint
    const firstCategoryId = Object.values(createdCategories)[0];
    const detailsResponse = await axios.get(`${API_BASE_URL}/meta/categories/${firstCategoryId}/details?includeProducts=true`);
    console.log('✅ Category details:', {
      hasChildren: detailsResponse.data.hasChildren,
      hasProducts: detailsResponse.data.hasProducts,
      canHaveBoth: detailsResponse.data.canHaveBoth
    });
    
    // Test category tree endpoint
    const treeResponse = await axios.get(`${API_BASE_URL}/meta/categories/tree?storeId=${STORE_ID}`);
    console.log('✅ Category tree created with', treeResponse.data.length, 'root categories');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Instructions
console.log('📝 Instructions:');
console.log('1. Replace STORE_ID with your actual store ID');
console.log('2. Make sure your backend server is running');
console.log('3. Run: node examples/flexible-categories.js\n');

// Uncomment to run
// createFlexibleCategoryStructure();

module.exports = { createFlexibleCategoryStructure }; 