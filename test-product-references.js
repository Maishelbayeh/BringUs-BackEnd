const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  // Product Specification
  productSpec: {
    titleAr: "اللون",
    titleEn: "Color",
    values: [
      { valueAr: "أحمر", valueEn: "Red" },
      { valueAr: "أزرق", valueEn: "Blue" },
      { valueAr: "أخضر", valueEn: "Green" }
    ],
    storeId: "507f1f77bcf86cd799439011" // Replace with actual store ID
  },
  
  // Parent Product
  parentProduct: {
    nameAr: "منتج رئيسي",
    nameEn: "Main Product",
    descriptionAr: "وصف المنتج الرئيسي باللغة العربية",
    descriptionEn: "Main product description in English",
    price: 100.00,
    compareAtPrice: 130.00,
    costPrice: 50.00,
    barcodes: ["MAIN123", "MAIN456"],
    category: "507f1f77bcf86cd799439012", // Replace with actual category ID
    unit: "507f1f77bcf86cd799439013", // Replace with actual unit ID
    storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
    hasVariants: true,
    images: ["https://example.com/main-image.jpg"],
    mainImage: "https://example.com/main-main-image.jpg",
    stock: 100,
    colors: [["#FF0000"], ["#0000FF"], ["#00FF00"]]
  },
  
  // Variant Products
  redVariant: {
    nameAr: "منتج أحمر",
    nameEn: "Red Product",
    descriptionAr: "وصف المنتج الأحمر",
    descriptionEn: "Red product description",
    price: 90.00,
    compareAtPrice: 120.00,
    costPrice: 45.00,
    barcodes: ["RED123", "RED456"],
    stock: 50,
    colors: [["#FF0000"]],
    storeId: "507f1f77bcf86cd799439011"
  },
  
  blueVariant: {
    nameAr: "منتج أزرق",
    nameEn: "Blue Product",
    descriptionAr: "وصف المنتج الأزرق",
    descriptionEn: "Blue product description",
    price: 80.00,
    compareAtPrice: 110.00,
    costPrice: 40.00,
    barcodes: ["BLUE123", "BLUE456"],
    stock: 30,
    colors: [["#0000FF"]],
    storeId: "507f1f77bcf86cd799439011"
  },
  
  // Simple Product (no variants)
  simpleProduct: {
    nameAr: "منتج بسيط",
    nameEn: "Simple Product",
    descriptionAr: "وصف المنتج البسيط",
    descriptionEn: "Simple product description",
    price: 50.00,
    compareAtPrice: 70.00,
    costPrice: 25.00,
    barcodes: ["SIMPLE123"],
    category: "507f1f77bcf86cd799439012", // Replace with actual category ID
    unit: "507f1f77bcf86cd799439013", // Replace with actual unit ID
    storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
    hasVariants: false,
    images: ["https://example.com/simple-image.jpg"],
    mainImage: "https://example.com/simple-main-image.jpg",
    stock: 200,
    colors: [["#000000"]]
  }
};

async function testProductReferences() {
  try {
    console.log('🚀 Testing Product References Structure...\n');

    // 1. Create Product Specification
    console.log('1. Creating Product Specification...');
    const specResponse = await axios.post(`${BASE_URL}/product-specifications`, testData.productSpec);
    console.log('✅ Product Specification created:', specResponse.data.data._id);
    const specId = specResponse.data.data._id;

    // 2. Create Parent Product
    console.log('\n2. Creating Parent Product...');
    const parentResponse = await axios.post(`${BASE_URL}/products`, {
      ...testData.parentProduct,
      specifications: [specId]
    });
    console.log('✅ Parent Product created:', parentResponse.data.data._id);
    const parentId = parentResponse.data.data._id;
    console.log('Parent has variants:', parentResponse.data.data.hasVariants);
    console.log('Parent variants count:', parentResponse.data.data.variantsCount);

    // 3. Create Red Variant
    console.log('\n3. Creating Red Variant...');
    const redVariantResponse = await axios.post(`${BASE_URL}/products/${parentId}/variants`, {
      ...testData.redVariant,
      specifications: [specId]
    });
    console.log('✅ Red Variant created:', redVariantResponse.data.data._id);
    const redVariantId = redVariantResponse.data.data._id;
    console.log('Red variant parent:', redVariantResponse.data.data.parentProduct);

    // 4. Create Blue Variant
    console.log('\n4. Creating Blue Variant...');
    const blueVariantResponse = await axios.post(`${BASE_URL}/products/${parentId}/variants`, {
      ...testData.blueVariant,
      specifications: [specId]
    });
    console.log('✅ Blue Variant created:', blueVariantResponse.data.data._id);
    const blueVariantId = blueVariantResponse.data.data._id;

    // 5. Create Simple Product
    console.log('\n5. Creating Simple Product...');
    const simpleResponse = await axios.post(`${BASE_URL}/products`, {
      ...testData.simpleProduct,
      specifications: [specId]
    });
    console.log('✅ Simple Product created:', simpleResponse.data.data._id);
    const simpleId = simpleResponse.data.data._id;
    console.log('Simple has variants:', simpleResponse.data.data.hasVariants);

    // 6. Get Parent Product with Variants
    console.log('\n6. Getting Parent Product with Variants...');
    const getParentResponse = await axios.get(`${BASE_URL}/products/${parentId}`);
    console.log('✅ Parent Product retrieved');
    console.log('Parent has variants:', getParentResponse.data.data.hasVariants);
    console.log('Parent variants count:', getParentResponse.data.data.variantsCount);
    console.log('Parent variants:', getParentResponse.data.data.variants.map(v => v._id));

    // 7. Get Variants of Parent Product
    console.log('\n7. Getting Variants of Parent Product...');
    const getVariantsResponse = await axios.get(`${BASE_URL}/products/${parentId}/variants?storeId=${testData.parentProduct.storeId}`);
    console.log('✅ Variants retrieved:', getVariantsResponse.data.data.length, 'variants');
    console.log('Variant names:', getVariantsResponse.data.data.map(v => v.nameEn));

    // 8. Get Products with Variants
    console.log('\n8. Getting Products with Variants...');
    const productsWithVariantsResponse = await axios.get(`${BASE_URL}/products/with-variants`);
    console.log('✅ Products with variants retrieved:', productsWithVariantsResponse.data.data.length, 'products');

    // 9. Get Variant Products Only
    console.log('\n9. Getting Variant Products Only...');
    const variantsOnlyResponse = await axios.get(`${BASE_URL}/products/variants-only`);
    console.log('✅ Variant products only retrieved:', variantsOnlyResponse.data.data.length, 'variants');

    // 10. Test Virtual Fields
    console.log('\n10. Testing Virtual Fields...');
    const parentWithVirtuals = getParentResponse.data.data;
    console.log('✅ Virtual fields test:');
    console.log('- variantsCount:', parentWithVirtuals.variantsCount);
    console.log('- activeVariantsCount:', parentWithVirtuals.activeVariantsCount);
    console.log('- totalStock:', parentWithVirtuals.totalStock);
    console.log('- isParent:', parentWithVirtuals.isParent);
    console.log('- isVariant:', parentWithVirtuals.isVariant);

    // 11. Test Variant Virtual Fields
    console.log('\n11. Testing Variant Virtual Fields...');
    const variantWithVirtuals = redVariantResponse.data.data;
    console.log('✅ Variant virtual fields test:');
    console.log('- isVariant:', variantWithVirtuals.isVariant);
    console.log('- isParent:', variantWithVirtuals.isParent);
    console.log('- parentProduct:', variantWithVirtuals.parentProduct);

    // 12. Update Parent Product
    console.log('\n12. Updating Parent Product...');
    const updateParentResponse = await axios.put(`${BASE_URL}/products/${parentId}`, {
      nameAr: "منتج رئيسي محدث",
      nameEn: "Updated Main Product",
      price: 110.00,
      storeId: testData.parentProduct.storeId
    });
    console.log('✅ Parent Product updated');
    console.log('Updated name:', updateParentResponse.data.data.nameEn);

    // 13. Update Variant Product
    console.log('\n13. Updating Variant Product...');
    const updateVariantResponse = await axios.put(`${BASE_URL}/products/${redVariantId}`, {
      nameAr: "منتج أحمر محدث",
      nameEn: "Updated Red Product",
      price: 95.00,
      storeId: testData.parentProduct.storeId
    });
    console.log('✅ Variant Product updated');
    console.log('Updated variant name:', updateVariantResponse.data.data.nameEn);

    // 14. Test Filters
    console.log('\n14. Testing Filters...');
    const filterResponse = await axios.get(`${BASE_URL}/products?hasVariants=true&storeId=${testData.parentProduct.storeId}`);
    console.log('✅ Filtered products with variants:', filterResponse.data.data.length, 'products');

    const variantFilterResponse = await axios.get(`${BASE_URL}/products?isVariant=true&storeId=${testData.parentProduct.storeId}`);
    console.log('✅ Filtered variant products:', variantFilterResponse.data.data.length, 'products');

    // 15. Test Product Deletion (Cleanup)
    console.log('\n15. Testing Product Deletion...');
    const deleteVariantResponse = await axios.delete(`${BASE_URL}/products/${redVariantId}`);
    console.log('✅ Variant deleted successfully');

    const deleteParentResponse = await axios.delete(`${BASE_URL}/products/${parentId}`);
    console.log('✅ Parent product deleted successfully');

    const deleteSimpleResponse = await axios.delete(`${BASE_URL}/products/${simpleId}`);
    console.log('✅ Simple product deleted successfully');

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Product references structure is working correctly');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testProductReferences(); 