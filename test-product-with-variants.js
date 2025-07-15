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
  
  // Product with variants
  productWithVariants: {
    nameAr: "منتج مع متغيرات",
    nameEn: "Product with Variants",
    descriptionAr: "وصف المنتج مع المتغيرات باللغة العربية",
    descriptionEn: "Product description with variants in English",
    price: 99.99,
    compareAtPrice: 129.99,
    costPrice: 50.00,
    barcodes: ["123456789", "987654321"],
    category: "507f1f77bcf86cd799439012", // Replace with actual category ID
    unit: "507f1f77bcf86cd799439013", // Replace with actual unit ID
    storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
    hasVariants: true,
    variants: [
      {
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
        images: [{
          public_id: "red_variant_1",
          url: "https://example.com/red-variant.jpg",
          alt: "Red variant image"
        }],
        mainImage: {
          public_id: "red_variant_main",
          url: "https://example.com/red-variant-main.jpg",
          alt: "Red variant main image"
        },
        colors: ["#FF0000"],
        isActive: true,
        isDefault: true
      },
      {
        variantNameAr: "متغير أزرق",
        variantNameEn: "Blue Variant",
        price: 79.99,
        compareAtPrice: 109.99,
        costPrice: 40.00,
        sku: "BLUE-VARIANT-001",
        barcodes: ["BLUE123456", "BLUE789012"],
        stock: 30,
        lowStockThreshold: 5,
        weight: 1.2,
        dimensions: {
          length: 8,
          width: 4,
          height: 2
        },
        images: [{
          public_id: "blue_variant_1",
          url: "https://example.com/blue-variant.jpg",
          alt: "Blue variant image"
        }],
        mainImage: {
          public_id: "blue_variant_main",
          url: "https://example.com/blue-variant-main.jpg",
          alt: "Blue variant main image"
        },
        colors: ["#0000FF"],
        isActive: true,
        isDefault: false
      }
    ],
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    mainImage: "https://example.com/main-image.jpg",
    stock: 100,
    colors: [["#FF0000"], ["#0000FF"], ["#00FF00"]]
  },
  
  // Product without variants
  productWithoutVariants: {
    nameAr: "منتج بدون متغيرات",
    nameEn: "Product without Variants",
    descriptionAr: "وصف المنتج بدون متغيرات باللغة العربية",
    descriptionEn: "Product description without variants in English",
    price: 49.99,
    compareAtPrice: 69.99,
    costPrice: 25.00,
    barcodes: ["SIMPLE123", "SIMPLE456"],
    category: "507f1f77bcf86cd799439012", // Replace with actual category ID
    unit: "507f1f77bcf86cd799439013", // Replace with actual unit ID
    storeId: "507f1f77bcf86cd799439011", // Replace with actual store ID
    hasVariants: false,
    variants: [],
    images: ["https://example.com/simple-image.jpg"],
    mainImage: "https://example.com/simple-main-image.jpg",
    stock: 200,
    colors: [["#000000"]]
  }
};

async function testProductWithVariants() {
  try {
    console.log('🚀 Testing new product structure with embedded variants...\n');

    // 1. Create Product Specification
    console.log('1. Creating Product Specification...');
    const specResponse = await axios.post(`${BASE_URL}/product-specifications`, testData.productSpec);
    console.log('✅ Product Specification created:', specResponse.data.data._id);
    const specId = specResponse.data.data._id;

    // 2. Create Product with Variants
    console.log('\n2. Creating Product with Variants...');
    const productWithVariantsResponse = await axios.post(`${BASE_URL}/products`, {
      ...testData.productWithVariants,
      specifications: [specId]
    });
    console.log('✅ Product with variants created:', productWithVariantsResponse.data.data._id);
    const productWithVariantsId = productWithVariantsResponse.data.data._id;
    console.log('Product has variants:', productWithVariantsResponse.data.data.hasVariants);
    console.log('Number of variants:', productWithVariantsResponse.data.data.variantsCount);

    // 3. Create Product without Variants
    console.log('\n3. Creating Product without Variants...');
    const productWithoutVariantsResponse = await axios.post(`${BASE_URL}/products`, {
      ...testData.productWithoutVariants,
      specifications: [specId]
    });
    console.log('✅ Product without variants created:', productWithoutVariantsResponse.data.data._id);
    const productWithoutVariantsId = productWithoutVariantsResponse.data.data._id;
    console.log('Product has variants:', productWithoutVariantsResponse.data.data.hasVariants);
    console.log('Number of variants:', productWithoutVariantsResponse.data.data.variantsCount);

    // 4. Add a new variant to existing product
    console.log('\n4. Adding new variant to product...');
    const newVariant = {
      variantNameAr: "متغير أخضر",
      variantNameEn: "Green Variant",
      price: 69.99,
      compareAtPrice: 89.99,
      costPrice: 35.00,
      sku: "GREEN-VARIANT-001",
      barcodes: ["GREEN123456", "GREEN789012"],
      stock: 25,
      colors: ["#00FF00"],
      storeId: testData.productWithVariants.storeId
    };
    
    const addVariantResponse = await axios.post(`${BASE_URL}/products/${productWithVariantsId}/variants`, newVariant);
    console.log('✅ New variant added successfully');
    console.log('Updated variants count:', addVariantResponse.data.data.variantsCount);

    // 5. Update a specific variant
    console.log('\n5. Updating specific variant...');
    const updateVariantData = {
      variantNameAr: "متغير أحمر محدث",
      variantNameEn: "Updated Red Variant",
      price: 95.99,
      storeId: testData.productWithVariants.storeId
    };
    
    const updateVariantResponse = await axios.put(`${BASE_URL}/products/${productWithVariantsId}/variants/0`, updateVariantData);
    console.log('✅ Variant updated successfully');
    console.log('Updated variant name:', updateVariantResponse.data.data.variants[0].variantNameAr);

    // 6. Get Product with all details
    console.log('\n6. Getting Product with details...');
    const getProductResponse = await axios.get(`${BASE_URL}/products/${productWithVariantsId}`);
    console.log('✅ Product details retrieved');
    console.log('Product has variants:', getProductResponse.data.data.hasVariants);
    console.log('Total variants count:', getProductResponse.data.data.variantsCount);
    console.log('Active variants count:', getProductResponse.data.data.activeVariantsCount);
    console.log('Total stock (including variants):', getProductResponse.data.data.totalStock);
    console.log('Product barcodes:', getProductResponse.data.data.barcodes);

    // 7. Get Products with Variants
    console.log('\n7. Getting Products with Variants...');
    const productsWithVariantsResponse = await axios.get(`${BASE_URL}/products/with-variants`);
    console.log('✅ Products with variants retrieved:', productsWithVariantsResponse.data.data.length, 'products');

    // 8. Get Products with Filters
    console.log('\n8. Getting Products with Filters...');
    const productsWithFiltersResponse = await axios.get(`${BASE_URL}/products?hasVariants=true&storeId=${testData.productWithVariants.storeId}`);
    console.log('✅ Products with filters retrieved:', productsWithFiltersResponse.data.data.length, 'products');

    // 9. Delete a variant
    console.log('\n9. Deleting a variant...');
    const deleteVariantResponse = await axios.delete(`${BASE_URL}/products/${productWithVariantsId}/variants/1?storeId=${testData.productWithVariants.storeId}`);
    console.log('✅ Variant deleted successfully');
    console.log('Remaining variants count:', deleteVariantResponse.data.data.variantsCount);

    // 10. Test virtual fields
    console.log('\n10. Testing virtual fields...');
    const finalProductResponse = await axios.get(`${BASE_URL}/products/${productWithVariantsId}`);
    const product = finalProductResponse.data.data;
    console.log('✅ Virtual fields test:');
    console.log('- variantsCount:', product.variantsCount);
    console.log('- activeVariantsCount:', product.activeVariantsCount);
    console.log('- totalStock:', product.totalStock);
    console.log('- allColors:', product.allColors);
    console.log('- colorOptionsCount:', product.colorOptionsCount);
    console.log('- discountPercentage:', product.discountPercentage);
    console.log('- finalPrice:', product.finalPrice);
    console.log('- stockStatus:', product.stockStatus);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testProductWithVariants(); 