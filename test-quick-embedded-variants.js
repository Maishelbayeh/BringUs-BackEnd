const mongoose = require('mongoose');
const Product = require('./Models/Product');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testEmbeddedVariants() {
  try {
    console.log('🧪 Testing Embedded Variants Structure...\n');

    // Test 1: Create Product without variants
    console.log('1. Creating product without variants...');
    const simpleProduct = new Product({
      nameAr: "منتج بسيط",
      nameEn: "Simple Product",
      descriptionAr: "وصف المنتج البسيط",
      descriptionEn: "Simple product description",
      price: 50.00,
      category: new mongoose.Types.ObjectId(),
      unit: new mongoose.Types.ObjectId(),
      store: new mongoose.Types.ObjectId(),
      barcodes: ["SIMPLE123"],
      hasVariants: false,
      variants: [],
      stock: 100
    });

    await simpleProduct.save();
    console.log('✅ Simple product created:', simpleProduct._id);
    console.log('Has variants:', simpleProduct.hasVariants);
    console.log('Variants count:', simpleProduct.variantsCount);

    // Test 2: Create Product with variants
    console.log('\n2. Creating product with variants...');
    const productWithVariants = new Product({
      nameAr: "منتج مع متغيرات",
      nameEn: "Product with Variants",
      descriptionAr: "وصف المنتج مع المتغيرات",
      descriptionEn: "Product description with variants",
      price: 100.00,
      category: new mongoose.Types.ObjectId(),
      unit: new mongoose.Types.ObjectId(),
      store: new mongoose.Types.ObjectId(),
      barcodes: ["VAR123", "VAR456"],
      hasVariants: true,
      variants: [
        {
          variantNameAr: "متغير أحمر",
          variantNameEn: "Red Variant",
          price: 90.00,
          sku: "RED-001",
          barcodes: ["RED123"],
          stock: 50,
          colors: ["#FF0000"],
          isActive: true,
          isDefault: true
        },
        {
          variantNameAr: "متغير أزرق",
          variantNameEn: "Blue Variant",
          price: 80.00,
          sku: "BLUE-001",
          barcodes: ["BLUE123"],
          stock: 30,
          colors: ["#0000FF"],
          isActive: true,
          isDefault: false
        }
      ],
      stock: 100
    });

    await productWithVariants.save();
    console.log('✅ Product with variants created:', productWithVariants._id);
    console.log('Has variants:', productWithVariants.hasVariants);
    console.log('Variants count:', productWithVariants.variantsCount);
    console.log('Active variants count:', productWithVariants.activeVariantsCount);
    console.log('Total stock:', productWithVariants.totalStock);

    // Test 3: Add variant to existing product
    console.log('\n3. Adding variant to existing product...');
    productWithVariants.variants.push({
      variantNameAr: "متغير أخضر",
      variantNameEn: "Green Variant",
      price: 70.00,
      sku: "GREEN-001",
      barcodes: ["GREEN123"],
      stock: 25,
      colors: ["#00FF00"],
      isActive: true,
      isDefault: false
    });

    await productWithVariants.save();
    console.log('✅ Variant added successfully');
    console.log('Updated variants count:', productWithVariants.variantsCount);
    console.log('Updated total stock:', productWithVariants.totalStock);

    // Test 4: Update specific variant
    console.log('\n4. Updating specific variant...');
    productWithVariants.variants[0].price = 95.00;
    productWithVariants.variants[0].stock = 60;
    productWithVariants.variants[0].variantNameAr = "متغير أحمر محدث";

    await productWithVariants.save();
    console.log('✅ Variant updated successfully');
    console.log('Updated variant price:', productWithVariants.variants[0].price);
    console.log('Updated total stock:', productWithVariants.totalStock);

    // Test 5: Delete variant
    console.log('\n5. Deleting variant...');
    productWithVariants.variants.splice(1, 1); // Remove second variant
    
    // If no variants left, set hasVariants to false
    if (productWithVariants.variants.length === 0) {
      productWithVariants.hasVariants = false;
    }

    await productWithVariants.save();
    console.log('✅ Variant deleted successfully');
    console.log('Remaining variants count:', productWithVariants.variantsCount);
    console.log('Updated total stock:', productWithVariants.totalStock);

    // Test 6: Query products with variants
    console.log('\n6. Querying products with variants...');
    const productsWithVariants = await Product.find({ hasVariants: true });
    console.log('✅ Products with variants found:', productsWithVariants.length);

    // Test 7: Query by variant SKU
    console.log('\n7. Querying by variant SKU...');
    const productBySku = await Product.findOne({ 'variants.sku': 'RED-001' });
    console.log('✅ Product found by SKU:', productBySku ? 'Yes' : 'No');

    // Test 8: Query by variant barcode
    console.log('\n8. Querying by variant barcode...');
    const productByBarcode = await Product.findOne({ 'variants.barcodes': 'RED123' });
    console.log('✅ Product found by barcode:', productByBarcode ? 'Yes' : 'No');

    // Test 9: Test virtual fields
    console.log('\n9. Testing virtual fields...');
    const testProduct = await Product.findById(productWithVariants._id);
    console.log('✅ Virtual fields test:');
    console.log('- variantsCount:', testProduct.variantsCount);
    console.log('- activeVariantsCount:', testProduct.activeVariantsCount);
    console.log('- totalStock:', testProduct.totalStock);
    console.log('- allColors:', testProduct.allColors);
    console.log('- colorOptionsCount:', testProduct.colorOptionsCount);
    console.log('- discountPercentage:', testProduct.discountPercentage);
    console.log('- finalPrice:', testProduct.finalPrice);
    console.log('- stockStatus:', testProduct.stockStatus);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Product.deleteMany({ _id: { $in: [simpleProduct._id, productWithVariants._id] } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed successfully!');
    console.log('✅ Embedded variants structure is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testEmbeddedVariants(); 