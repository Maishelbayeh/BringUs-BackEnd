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
  
  // Product
  product: {
    nameAr: "منتج تجريبي",
    nameEn: "Test Product",
    descriptionAr: "وصف المنتج باللغة العربية",
    descriptionEn: "Product description in English",
    price: 99.99,
    compareAtPrice: 129.99,
    costPrice: 50.00,
    barcodes: ["123456789", "987654321"],
    category: "507f1f77bcf86cd799439012", // Replace with actual category ID
    unit: "507f1f77bcf86cd799439013", // Replace with actual unit ID
    storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
    hasVariants: true,
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    mainImage: "https://example.com/main-image.jpg",
    stock: 100,
    colors: [["#FF0000"], ["#0000FF"], ["#00FF00"]]
  },
  
  // Product Variant
  productVariant: {
    productId: "", // Will be filled after product creation
    variantNameAr: "متغير أحمر",
    variantNameEn: "Red Variant",
    price: 89.99,
    compareAtPrice: 119.99,
    costPrice: 45.00,
    sku: "RED-VARIANT-001",
    barcodes: ["RED123456", "RED789012"],
    stock: 50,
    lowStockThreshold: 5,
    weight: 1.5,
    dimensions: {
      length: 10,
      width: 5,
      height: 3
    },
    images: ["https://example.com/red-variant.jpg"],
    mainImage: "https://example.com/red-variant-main.jpg",
    colors: ["#FF0000"],
    storeId: "507f1f77bcf86cd799439011" // Replace with actual store ID
  }
};

async function testNewProductStructure() {
  try {
    console.log('🚀 Testing new product structure...\n');

    // 1. Create Product Specification
    console.log('1. Creating Product Specification...');
    const specResponse = await axios.post(`${BASE_URL}/product-specifications`, testData.productSpec);
    console.log('✅ Product Specification created:', specResponse.data.data._id);
    const specId = specResponse.data.data._id;

    // 2. Create Product
    console.log('\n2. Creating Product...');
    const productResponse = await axios.post(`${BASE_URL}/products`, {
      ...testData.product,
      specifications: [specId]
    });
    console.log('✅ Product created:', productResponse.data.data._id);
    const productId = productResponse.data.data._id;

    // 3. Create Product Variant
    console.log('\n3. Creating Product Variant...');
    const variantResponse = await axios.post(`${BASE_URL}/product-variants`, {
      ...testData.productVariant,
      productId: productId,
      specifications: [{
        specificationId: specId,
        value: "أحمر"
      }]
    });
    console.log('✅ Product Variant created:', variantResponse.data.data._id);

    // 4. Get Product with all details
    console.log('\n4. Getting Product with details...');
    const getProductResponse = await axios.get(`${BASE_URL}/products/${productId}`);
    console.log('✅ Product details retrieved');
    console.log('Product has variants:', getProductResponse.data.data.hasVariants);
    console.log('Product barcodes:', getProductResponse.data.data.barcodes);

    // 5. Get Product Variants
    console.log('\n5. Getting Product Variants...');
    const variantsResponse = await axios.get(`${BASE_URL}/product-variants/by-product/${productId}?storeId=${testData.product.storeId}`);
    console.log('✅ Product Variants retrieved:', variantsResponse.data.data.length, 'variants');

    // 6. Get Product Specifications by Store
    console.log('\n6. Getting Product Specifications by Store...');
    const specsResponse = await axios.get(`${BASE_URL}/product-specifications/by-store?storeId=${testData.product.storeId}`);
    console.log('✅ Product Specifications retrieved:', specsResponse.data.data.length, 'specifications');

    // 7. Get Products with Variants
    console.log('\n7. Getting Products with Variants...');
    const productsWithVariantsResponse = await axios.get(`${BASE_URL}/products/with-variants`);
    console.log('✅ Products with variants retrieved:', productsWithVariantsResponse.data.data.length, 'products');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testNewProductStructure(); 