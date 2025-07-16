const mongoose = require('mongoose');
const Product = require('../Models/Product');
const ProductSpecification = require('../Models/ProductSpecification');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

const createProductsWithSpecifications = async () => {
  try {
    //CONSOLE.log('🚀 Creating products with specifications...\n');

    // Get or create test category
    let testCategory = await Category.findOne({ 
      store: storeId, 
      nameEn: 'Test Category' 
    });
    
    if (!testCategory) {
      testCategory = new Category({
        nameAr: 'فئة تجريبية',
        nameEn: 'Test Category',
        slug: 'test-category',
        descriptionAr: 'فئة تجريبية للمنتجات',
        descriptionEn: 'Test category for products',
        store: storeId,
        level: 0,
        isActive: true
      });
      await testCategory.save();
      //CONSOLE.log('✅ Created test category:', testCategory._id);
    } else {
      //CONSOLE.log('✅ Using existing test category:', testCategory._id);
    }

    // Get or create test unit
    let testUnit = await Unit.findOne({ 
      nameEn: 'Piece' 
    });
    
    if (!testUnit) {
      testUnit = new Unit({
        nameAr: 'قطعة',
        nameEn: 'Piece',
        symbol: 'pc',
        isActive: true
      });
      await testUnit.save();
      //CONSOLE.log('✅ Created test unit:', testUnit._id);
    } else {
      //CONSOLE.log('✅ Using existing test unit:', testUnit._id);
    }

    // Get product specifications
    const specifications = await ProductSpecification.find({ store: storeId });
    //CONSOLE.log(`✅ Found ${specifications.length} product specifications`);

    if (specifications.length === 0) {
      //CONSOLE.log('⚠️ No product specifications found. Please run create-sample-product-specifications.js first.');
      return;
    }

    // Clear existing products for this store
    await Product.deleteMany({ store: storeId });
    //CONSOLE.log('✅ Cleared existing products for store');

    // Create products with specifications
    const productsData = [
      {
        nameAr: 'قميص قطني كلاسيك',
        nameEn: 'Classic Cotton Shirt',
        descriptionAr: 'قميص قطني عالي الجودة، مريح وأنيق للاستخدام اليومي',
        descriptionEn: 'High-quality cotton shirt, comfortable and elegant for daily use',
        price: 75.99,
        compareAtPrice: 99.99,
        costPrice: 45.50,
        barcode: '1234567890123',
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 50,
        stock: 50,
        visibility: true,
        isActive: true,
        specifications: [specifications[0]._id, specifications[1]._id, specifications[2]._id], // طويل، قصير، كبير
        colors: [['#000000'], ['#FFFFFF'], ['#0000FF']],
        images: ['https://example.com/images/shirt-1.jpg'],
        mainImage: 'https://example.com/images/shirt-main.jpg'
      },
      {
        nameAr: 'جينز كلاسيك',
        nameEn: 'Classic Jeans',
        descriptionAr: 'جينز كلاسيك عالي الجودة، مريح للاستخدام اليومي',
        descriptionEn: 'High-quality classic jeans, comfortable for daily use',
        price: 120.99,
        compareAtPrice: 150.99,
        costPrice: 80.50,
        barcode: '1234567890124',
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 30,
        stock: 30,
        visibility: true,
        isActive: true,
        specifications: [specifications[5]._id, specifications[6]._id, specifications[7]._id], // نمرة 40، نمرة 42، نمرة 44
        colors: [['#000080'], ['#000000']],
        images: ['https://example.com/images/jeans-1.jpg'],
        mainImage: 'https://example.com/images/jeans-main.jpg'
      },
      {
        nameAr: 'حقيبة جلدية أنيقة',
        nameEn: 'Elegant Leather Bag',
        descriptionAr: 'حقيبة جلدية أنيقة عالية الجودة',
        descriptionEn: 'High-quality elegant leather bag',
        price: 200.99,
        compareAtPrice: 250.99,
        costPrice: 150.50,
        barcode: '1234567890125',
        category: testCategory._id,
        unit: testUnit._id,
        store: storeId,
        availableQuantity: 20,
        stock: 20,
        visibility: true,
        isActive: true,
        specifications: [specifications[3]._id, specifications[4]._id, specifications[8]._id], // وسط، صغير، عريض
        colors: [['#8B4513'], ['#000000']],
        images: ['https://example.com/images/bag-1.jpg'],
        mainImage: 'https://example.com/images/bag-main.jpg'
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    //CONSOLE.log(`✅ Created ${createdProducts.length} products with specifications`);

    // Display created products summary
    createdProducts.forEach((product, index) => {
      //CONSOLE.log(`\n${index + 1}. ${product.nameEn} (${product.nameAr}):`);
      //CONSOLE.log(`   Price: $${product.price}`);
      //CONSOLE.log(`   Barcode: ${product.barcode}`);
      //CONSOLE.log(`   Colors: ${product.colors.length} options`);
      //CONSOLE.log(`   Stock: ${product.stock}`);
      //CONSOLE.log(`   Specifications: ${product.specifications.length} specifications`);
      //CONSOLE.log(`   ID: ${product._id}`);
    });

    // Test population
    //CONSOLE.log('\n🔍 Testing population...');
    const populatedProducts = await Product.find({ store: storeId })
      .populate('specifications')
      .populate('category')
      .populate('unit');
    
    populatedProducts.forEach(product => {
      //CONSOLE.log(`\n  Product: ${product.nameEn}`);
      //CONSOLE.log(`    Specifications:`, product.specifications.map(spec => spec.descriptionEn).join(', '));
    });

    //CONSOLE.log('\n🎉 Products with specifications created successfully!');

  } catch (error) {
    //CONSOLE.error('❌ Error creating products with specifications:', error);
  } finally {
    mongoose.connection.close();
  }
};

createProductsWithSpecifications(); 