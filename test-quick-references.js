const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Quick test data
const testData = {
  storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
  categoryId: "507f1f77bcf86cd799439012", // Replace with actual category ID
  unitId: "507f1f77bcf86cd799439013" // Replace with actual unit ID
};

async function quickTest() {
  try {
    console.log('🚀 Quick Test - Product References Structure\n');

    // 1. Create Parent Product
    console.log('1. Creating Parent Product...');
    const parentResponse = await axios.post(`${BASE_URL}/products`, {
      nameAr: "منتج رئيسي",
      nameEn: "Main Product",
      descriptionAr: "وصف المنتج الرئيسي",
      descriptionEn: "Main product description",
      price: 100.00,
      category: testData.categoryId,
      unit: testData.unitId,
      storeId: testData.storeId,
      hasVariants: true,
      stock: 50
    });
    
    const parentId = parentResponse.data.data._id;
    console.log('✅ Parent created:', parentId);

    // 2. Create Variant via /variants endpoint
    console.log('\n2. Creating Variant via /variants endpoint...');
    const variantResponse = await axios.post(`${BASE_URL}/products/${parentId}/variants`, {
      nameAr: "منتج أحمر",
      nameEn: "Red Product",
      descriptionAr: "وصف المنتج الأحمر",
      descriptionEn: "Red product description",
      price: 90.00,
      stock: 30,
      storeId: testData.storeId
    });
    
    const variantId = variantResponse.data.data._id;
    console.log('✅ Variant created:', variantId);
    console.log('Variant parentProduct:', variantResponse.data.data.parentProduct);

    // 3. Create Variant via direct POST with parentProduct
    console.log('\n3. Creating Variant via direct POST...');
    const variant2Response = await axios.post(`${BASE_URL}/products`, {
      nameAr: "منتج أزرق",
      nameEn: "Blue Product",
      descriptionAr: "وصف المنتج الأزرق",
      descriptionEn: "Blue product description",
      price: 80.00,
      category: testData.categoryId,
      unit: testData.unitId,
      storeId: testData.storeId,
      parentProduct: parentId,
      stock: 20
    });
    
    const variant2Id = variant2Response.data.data._id;
    console.log('✅ Variant 2 created:', variant2Id);

    // 4. Get Parent with Variants
    console.log('\n4. Getting Parent with Variants...');
    const getParentResponse = await axios.get(`${BASE_URL}/products/${parentId}`);
    const parent = getParentResponse.data.data;
    
    console.log('✅ Parent retrieved');
    console.log('- hasVariants:', parent.hasVariants);
    console.log('- variantsCount:', parent.variantsCount);
    console.log('- isParent:', parent.isParent);
    console.log('- isVariant:', parent.isVariant);
    console.log('- variants array length:', parent.variants.length);

    // 5. Get Variants of Parent
    console.log('\n5. Getting Variants of Parent...');
    const getVariantsResponse = await axios.get(`${BASE_URL}/products/${parentId}/variants?storeId=${testData.storeId}`);
    console.log('✅ Variants retrieved:', getVariantsResponse.data.data.length, 'variants');
    console.log('Variant names:', getVariantsResponse.data.data.map(v => v.nameEn));

    // 6. Test Virtual Fields on Variant
    console.log('\n6. Testing Variant Virtual Fields...');
    const variant = variantResponse.data.data;
    console.log('✅ Variant virtual fields:');
    console.log('- isVariant:', variant.isVariant);
    console.log('- isParent:', variant.isParent);
    console.log('- parentProduct:', variant.parentProduct);

    // 7. Test Filters
    console.log('\n7. Testing Filters...');
    const withVariantsResponse = await axios.get(`${BASE_URL}/products/with-variants`);
    console.log('✅ Products with variants:', withVariantsResponse.data.data.length);

    const variantsOnlyResponse = await axios.get(`${BASE_URL}/products/variants-only`);
    console.log('✅ Variant products only:', variantsOnlyResponse.data.data.length);

    // 8. Update Parent
    console.log('\n8. Updating Parent...');
    const updateParentResponse = await axios.put(`${BASE_URL}/products/${parentId}`, {
      nameAr: "منتج رئيسي محدث",
      nameEn: "Updated Main Product",
      price: 110.00,
      storeId: testData.storeId
    });
    console.log('✅ Parent updated:', updateParentResponse.data.data.nameEn);

    // 9. Update Variant
    console.log('\n9. Updating Variant...');
    const updateVariantResponse = await axios.put(`${BASE_URL}/products/${variantId}`, {
      nameAr: "منتج أحمر محدث",
      nameEn: "Updated Red Product",
      price: 95.00,
      storeId: testData.storeId
    });
    console.log('✅ Variant updated:', updateVariantResponse.data.data.nameEn);

    // 10. Cleanup
    console.log('\n10. Cleaning up...');
    await axios.delete(`${BASE_URL}/products/${variant2Id}`);
    console.log('✅ Variant 2 deleted');
    
    await axios.delete(`${BASE_URL}/products/${variantId}`);
    console.log('✅ Variant 1 deleted');
    
    await axios.delete(`${BASE_URL}/products/${parentId}`);
    console.log('✅ Parent deleted');

    console.log('\n🎉 Quick test completed successfully!');
    console.log('✅ Product references structure is working correctly');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the quick test
quickTest(); 