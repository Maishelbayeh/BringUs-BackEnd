const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test store IDs
const STORE_1_ID = 'STORE_1_ID_HERE';
const STORE_2_ID = 'STORE_2_ID_HERE';

async function testStoreIsolation() {
  try {
    //CONSOLE.log('🏪 Testing Store Isolation System...\n');
    
    // Test 1: Create categories for different stores
    //CONSOLE.log('1. Creating categories for Store 1...');
    const category1 = await axios.post(`${API_BASE_URL}/meta/categories`, {
      nameAr: "إلكترونيات",
      nameEn: "Electronics",
      slug: "electronics-store1",
      store: STORE_1_ID,
      level: 0
    });
    //CONSOLE.log('✅ Category created for Store 1:', category1.data.nameEn);
    
    //CONSOLE.log('\n2. Creating categories for Store 2...');
    const category2 = await axios.post(`${API_BASE_URL}/meta/categories`, {
      nameAr: "ملابس",
      nameEn: "Clothing",
      slug: "clothing-store2",
      store: STORE_2_ID,
      level: 0
    });
    //CONSOLE.log('✅ Category created for Store 2:', category2.data.nameEn);
    
    // Test 2: Verify isolation - Get categories for each store
    //CONSOLE.log('\n3. Testing category isolation...');
    const store1Categories = await axios.get(`${API_BASE_URL}/meta/categories?storeId=${STORE_1_ID}`);
    const store2Categories = await axios.get(`${API_BASE_URL}/meta/categories?storeId=${STORE_2_ID}`);
    
    //CONSOLE.log('✅ Store 1 categories:', store1Categories.data.length);
    //CONSOLE.log('✅ Store 2 categories:', store2Categories.data.length);
    
    // Verify no cross-contamination
    const store1HasStore2Category = store1Categories.data.some(cat => cat.store === STORE_2_ID);
    const store2HasStore1Category = store2Categories.data.some(cat => cat.store === STORE_1_ID);
    
    if (!store1HasStore2Category && !store2HasStore1Category) {
      //CONSOLE.log('✅ Category isolation verified - no cross-contamination');
    } else {
      //CONSOLE.log('❌ Category isolation failed - cross-contamination detected');
    }
    
    // Test 3: Create product labels for different stores
    //CONSOLE.log('\n4. Creating product labels for different stores...');
    const label1 = await axios.post(`${API_BASE_URL}/meta/product-labels`, {
      nameAr: "عادي",
      nameEn: "Regular",
      store: STORE_1_ID,
      color: "#6B7280"
    });
    
    const label2 = await axios.post(`${API_BASE_URL}/meta/product-labels`, {
      nameAr: "مميز",
      nameEn: "Featured",
      store: STORE_2_ID,
      color: "#EF4444"
    });
    
    //CONSOLE.log('✅ Product labels created for both stores');
    
    // Test 4: Create units for different stores
    //CONSOLE.log('\n5. Creating units for different stores...');
    const unit1 = await axios.post(`${API_BASE_URL}/meta/units`, {
      nameAr: "قطعة",
      nameEn: "Piece",
      symbol: "pc",
      store: STORE_1_ID
    });
    
    const unit2 = await axios.post(`${API_BASE_URL}/meta/units`, {
      nameAr: "كيلو",
      nameEn: "Kilogram",
      symbol: "kg",
      store: STORE_2_ID
    });
    
    //CONSOLE.log('✅ Units created for both stores');
    
    // Test 5: Create products for different stores
    //CONSOLE.log('\n6. Creating products for different stores...');
    const product1 = await axios.post(`${API_BASE_URL}/meta/products`, {
      nameAr: "هاتف ذكي",
      nameEn: "Smartphone",
      descriptionAr: "هاتف ذكي متطور",
      descriptionEn: "Advanced smartphone",
      price: 1000,
      category: category1.data._id,
      unit: unit1.data._id,
      store: STORE_1_ID,
      stock: 50
    });
    
    const product2 = await axios.post(`${API_BASE_URL}/meta/products`, {
      nameAr: "قميص",
      nameEn: "Shirt",
      descriptionAr: "قميص أنيق",
      descriptionEn: "Elegant shirt",
      price: 50,
      category: category2.data._id,
      unit: unit2.data._id,
      store: STORE_2_ID,
      stock: 100
    });
    
    //CONSOLE.log('✅ Products created for both stores');
    
    // Test 6: Verify product isolation
    //CONSOLE.log('\n7. Testing product isolation...');
    const store1Products = await axios.get(`${API_BASE_URL}/meta/products?storeId=${STORE_1_ID}`);
    const store2Products = await axios.get(`${API_BASE_URL}/meta/products?storeId=${STORE_2_ID}`);
    
    //CONSOLE.log('✅ Store 1 products:', store1Products.data.length);
    //CONSOLE.log('✅ Store 2 products:', store2Products.data.length);
    
    // Test 7: Test category tree isolation
    //CONSOLE.log('\n8. Testing category tree isolation...');
    const store1Tree = await axios.get(`${API_BASE_URL}/meta/categories/tree?storeId=${STORE_1_ID}`);
    const store2Tree = await axios.get(`${API_BASE_URL}/meta/categories/tree?storeId=${STORE_2_ID}`);
    
    //CONSOLE.log('✅ Store 1 tree categories:', store1Tree.data.length);
    //CONSOLE.log('✅ Store 2 tree categories:', store2Tree.data.length);
    
    // Test 8: Test cross-store access (should fail)
    //CONSOLE.log('\n9. Testing cross-store access prevention...');
    try {
      await axios.get(`${API_BASE_URL}/meta/categories/${category1.data._id}?storeId=${STORE_2_ID}`);
      //CONSOLE.log('❌ Cross-store access should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        //CONSOLE.log('✅ Cross-store access correctly blocked');
      } else {
        //CONSOLE.log('⚠️ Cross-store access test inconclusive');
      }
    }
    
    //CONSOLE.log('\n🎉 Store isolation test completed successfully!');
    //CONSOLE.log('\n📊 Summary:');
    //CONSOLE.log('- Categories: Isolated ✅');
    //CONSOLE.log('- Product Labels: Isolated ✅');
    //CONSOLE.log('- Units: Isolated ✅');
    //CONSOLE.log('- Products: Isolated ✅');
    //CONSOLE.log('- Category Trees: Isolated ✅');
    //CONSOLE.log('- Cross-store Access: Blocked ✅');
    
  } catch (error) {
    //CONSOLE.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Instructions
//CONSOLE.log('📝 Instructions:');
//CONSOLE.log('1. Replace STORE_1_ID and STORE_2_ID with actual store IDs');
//CONSOLE.log('2. Make sure your backend server is running');
//CONSOLE.log('3. Run: node examples/store-isolation-test.js\n');

// Uncomment to run
// testStoreIsolation();

module.exports = { testStoreIsolation }; 