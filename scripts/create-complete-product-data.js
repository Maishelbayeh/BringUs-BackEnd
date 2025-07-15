const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');
const ProductLabel = require('../Models/ProductLabel');
const ProductSpecification = require('../Models/ProductSpecification');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

// Complete product data with all fields - Updated to match new structure
const completeProducts = [
  {
    // Basic Information
    nameAr: 'قميص قطني كلاسيك',
    nameEn: 'Classic Cotton Shirt',
    descriptionAr: 'قميص قطني عالي الجودة، مريح وأنيق للاستخدام اليومي',
    descriptionEn: 'High-quality cotton shirt, comfortable and elegant for daily use',
    
    // Pricing
    price: 75.99,
    compareAtPrice: 99.99,
    costPrice: 45.50,
    
    // Identification - Updated to use barcodes array
    barcodes: ['1234567890123', 'SHIRT001'],
    
    // Store and Category
    store: storeId,
    category: null, // Will be set dynamically
    categoryPath: [], // Will be set dynamically
    
    // Images
    mainImage: 'https://example.com/images/shirt-main.jpg',
    images: [
      'https://example.com/images/shirt-1.jpg',
      'https://example.com/images/shirt-2.jpg',
      'https://example.com/images/shirt-3.jpg'
    ],
    
    // Product Labels
    productLabels: [], // Will be set dynamically
    
    // Unit
    unit: null, // Will be set dynamically
    
    // Inventory
    availableQuantity: 50,
    stock: 50,
    lowStockThreshold: 10,
    
    // Product Order
    productOrder: 1,
    
    // Visibility
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    
    // Variants
    hasVariants: false,
    variants: [],
    
    // Attributes and Specifications
    attributes: [
      { name: 'Material', value: 'Cotton' },
      { name: 'Fit', value: 'Regular' },
      { name: 'Sleeve', value: 'Long Sleeve' }
    ],
    specifications: [], // Will be populated with ProductSpecification ObjectIds
    
    // Physical Properties
    weight: 0.2,
    dimensions: {
      length: 70,
      width: 50,
      height: 5
    },
    
    // Colors - Updated to match new structure
    colors: [
      ['#000000'], // Black
      ['#FFFFFF'], // White
      ['#0000FF']  // Blue
    ],
    
    // Ratings and Reviews
    rating: 4.5,
    numReviews: 25,
    views: 150,
    soldCount: 30,
    
    // SEO
    seo: {
      title: 'Classic Cotton Shirt - Premium Quality',
      description: 'High-quality cotton shirt for daily wear',
      keywords: ['shirt', 'cotton', 'classic', 'fashion']
    }
  },
  
  {
    // Basic Information
    nameAr: 'بنطلون جينز عصري',
    nameEn: 'Modern Denim Jeans',
    descriptionAr: 'بنطلون جينز عصري بتصميم أنيق ومريح للاستخدام اليومي',
    descriptionEn: 'Modern denim jeans with elegant design and comfortable for daily use',
    
    // Pricing
    price: 120.50,
    compareAtPrice: 150.00,
    costPrice: 80.25,
    
    // Identification
    barcodes: ['1234567890124', 'JEANS001'],
    
    // Store and Category
    store: storeId,
    category: null,
    categoryPath: [],
    
    // Images
    mainImage: 'https://example.com/images/jeans-main.jpg',
    images: [
      'https://example.com/images/jeans-1.jpg',
      'https://example.com/images/jeans-2.jpg'
    ],
    
    // Product Labels
    productLabels: [],
    
    // Unit
    unit: null,
    
    // Inventory
    availableQuantity: 35,
    stock: 35,
    lowStockThreshold: 8,
    
    // Product Order
    productOrder: 2,
    
    // Visibility
    visibility: true,
    isActive: true,
    isFeatured: false,
    isOnSale: true,
    salePercentage: 20,
    
    // Variants
    hasVariants: false,
    variants: [],
    
    // Attributes and Specifications
    attributes: [
      { name: 'Material', value: 'Denim' },
      { name: 'Fit', value: 'Slim Fit' },
      { name: 'Style', value: 'Straight Leg' }
    ],
    specifications: [], // Will be populated with ProductSpecification ObjectIds
    
    // Physical Properties
    weight: 0.4,
    dimensions: {
      length: 100,
      width: 35,
      height: 8
    },
    
    // Colors
    colors: [
      ['#000080'], // Navy Blue
      ['#8B4513'], // Saddle Brown
      ['#000000']  // Black
    ],
    
    // Ratings and Reviews
    rating: 4.2,
    numReviews: 18,
    views: 120,
    soldCount: 22,
    
    // SEO
    seo: {
      title: 'Modern Denim Jeans - Trendy Style',
      description: 'Modern denim jeans with trendy design',
      keywords: ['jeans', 'denim', 'modern', 'trendy']
    }
  },
  
  {
    // Basic Information
    nameAr: 'حذاء رياضي مريح',
    nameEn: 'Comfortable Sports Shoes',
    descriptionAr: 'حذاء رياضي مريح ومتين للجري والرياضة اليومية',
    descriptionEn: 'Comfortable and durable sports shoes for running and daily sports',
    
    // Pricing
    price: 200.00,
    compareAtPrice: 250.00,
    costPrice: 120.00,
    
    // Identification
    barcodes: ['1234567890125', 'SHOES001'],
    
    // Store and Category
    store: storeId,
    category: null,
    categoryPath: [],
    
    // Images
    mainImage: 'https://example.com/images/shoes-main.jpg',
    images: [
      'https://example.com/images/shoes-1.jpg',
      'https://example.com/images/shoes-2.jpg',
      'https://example.com/images/shoes-3.jpg',
      'https://example.com/images/shoes-4.jpg'
    ],
    
    // Product Labels
    productLabels: [],
    
    // Unit
    unit: null,
    
    // Inventory
    availableQuantity: 25,
    stock: 25,
    lowStockThreshold: 5,
    
    // Product Order
    productOrder: 3,
    
    // Visibility
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: false,
    salePercentage: 0,
    
    // Variants
    hasVariants: false,
    variants: [],
    
    // Attributes and Specifications
    attributes: [
      { name: 'Material', value: 'Mesh & Rubber' },
      { name: 'Type', value: 'Running Shoes' },
      { name: 'Sole', value: 'Rubber Outsole' }
    ],
    specifications: [], // Will be populated with ProductSpecification ObjectIds
    
    // Physical Properties
    weight: 0.3,
    dimensions: {
      length: 28,
      width: 10,
      height: 12
    },
    
    // Colors
    colors: [
      ['#FFFFFF', '#FF0000'], // White with Red
      ['#000000', '#FFFFFF'], // Black with White
      ['#0000FF', '#FFFF00']  // Blue with Yellow
    ],
    
    // Ratings and Reviews
    rating: 4.8,
    numReviews: 42,
    views: 280,
    soldCount: 38,
    
    // SEO
    seo: {
      title: 'Comfortable Sports Shoes - Best for Running',
      description: 'Comfortable sports shoes perfect for running and daily sports',
      keywords: ['shoes', 'sports', 'running', 'comfortable']
    }
  },
  
  {
    // Basic Information
    nameAr: 'ساعة يد أنيقة',
    nameEn: 'Elegant Wristwatch',
    descriptionAr: 'ساعة يد أنيقة بتصميم كلاسيكي ومناسبة للمناسبات الرسمية',
    descriptionEn: 'Elegant wristwatch with classic design suitable for formal occasions',
    
    // Pricing
    price: 350.00,
    compareAtPrice: 450.00,
    costPrice: 200.00,
    
    // Identification
    barcodes: ['1234567890126', 'WATCH001'],
    
    // Store and Category
    store: storeId,
    category: null,
    categoryPath: [],
    
    // Images
    mainImage: 'https://example.com/images/watch-main.jpg',
    images: [
      'https://example.com/images/watch-1.jpg',
      'https://example.com/images/watch-2.jpg'
    ],
    
    // Product Labels
    productLabels: [],
    
    // Unit
    unit: null,
    
    // Inventory
    availableQuantity: 15,
    stock: 15,
    lowStockThreshold: 3,
    
    // Product Order
    productOrder: 4,
    
    // Visibility
    visibility: true,
    isActive: true,
    isFeatured: true,
    isOnSale: true,
    salePercentage: 25,
    
    // Variants
    hasVariants: false,
    variants: [],
    
    // Attributes and Specifications
    attributes: [
      { name: 'Material', value: 'Stainless Steel' },
      { name: 'Movement', value: 'Quartz' },
      { name: 'Water Resistance', value: '50m' }
    ],
    specifications: [], // Will be populated with ProductSpecification ObjectIds
    
    // Physical Properties
    weight: 0.08,
    dimensions: {
      length: 4,
      width: 4,
      height: 1
    },
    
    // Colors
    colors: [
      ['#C0C0C0'], // Silver
      ['#FFD700'], // Gold
      ['#000000']  // Black
    ],
    
    // Ratings and Reviews
    rating: 4.6,
    numReviews: 31,
    views: 200,
    soldCount: 28,
    
    // SEO
    seo: {
      title: 'Elegant Wristwatch - Classic Design',
      description: 'Elegant wristwatch with classic design for formal occasions',
      keywords: ['watch', 'elegant', 'classic', 'formal']
    }
  },
  
  {
    // Basic Information
    nameAr: 'حقيبة جلدية فاخرة',
    nameEn: 'Luxury Leather Bag',
    descriptionAr: 'حقيبة جلدية فاخرة بتصميم أنيق ومناسبة للاستخدام اليومي',
    descriptionEn: 'Luxury leather bag with elegant design suitable for daily use',
    
    // Pricing
    price: 180.00,
    compareAtPrice: 220.00,
    costPrice: 100.00,
    
    // Identification
    barcodes: ['1234567890127', 'BAG001'],
    
    // Store and Category
    store: storeId,
    category: null,
    categoryPath: [],
    
    // Images
    mainImage: 'https://example.com/images/bag-main.jpg',
    images: [
      'https://example.com/images/bag-1.jpg',
      'https://example.com/images/bag-2.jpg',
      'https://example.com/images/bag-3.jpg'
    ],
    
    // Product Labels
    productLabels: [],
    
    // Unit
    unit: null,
    
    // Inventory
    availableQuantity: 20,
    stock: 20,
    lowStockThreshold: 5,
    
    // Product Order
    productOrder: 5,
    
    // Visibility
    visibility: true,
    isActive: true,
    isFeatured: false,
    isOnSale: false,
    salePercentage: 0,
    
    // Variants
    hasVariants: false,
    variants: [],
    
    // Attributes and Specifications
    attributes: [
      { name: 'Material', value: 'Genuine Leather' },
      { name: 'Type', value: 'Shoulder Bag' },
      { name: 'Size', value: 'Medium' }
    ],
    specifications: [], // Will be populated with ProductSpecification ObjectIds
    
    // Physical Properties
    weight: 0.5,
    dimensions: {
      length: 30,
      width: 15,
      height: 20
    },
    
    // Colors
    colors: [
      ['#8B4513'], // Saddle Brown
      ['#000000'], // Black
      ['#800020']  // Burgundy
    ],
    
    // Ratings and Reviews
    rating: 4.4,
    numReviews: 19,
    views: 95,
    soldCount: 15,
    
    // SEO
    seo: {
      title: 'Luxury Leather Bag - Elegant Design',
      description: 'Luxury leather bag with elegant design for daily use',
      keywords: ['bag', 'leather', 'luxury', 'elegant']
    }
  }
];

async function createCompleteProductData() {
  try {
    console.log('=== Creating Complete Product Data ===\n');
    
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
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
      console.log('✅ Created test category:', testCategory._id);
    } else {
      console.log('✅ Using existing test category:', testCategory._id);
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
      console.log('✅ Created test unit:', testUnit._id);
    } else {
      console.log('✅ Using existing test unit:', testUnit._id);
    }
    
    // Get or create multiple product labels
    const labelNames = ['Regular', 'Featured', 'New', 'Sale'];
    const productLabels = [];
    
    for (const labelName of labelNames) {
      let label = await ProductLabel.findOne({ nameEn: labelName, store: storeId });
      
      if (!label) {
        const labelData = {
          nameAr: labelName === 'Regular' ? 'عادي' : 
                  labelName === 'Featured' ? 'مميز' :
                  labelName === 'New' ? 'جديد' : 'تخفيض',
          nameEn: labelName,
          descriptionAr: labelName === 'Regular' ? 'منتجات عادية' : 
                         labelName === 'Featured' ? 'منتجات مميزة' :
                         labelName === 'New' ? 'منتجات جديدة' : 'منتجات مخفضة',
          descriptionEn: labelName === 'Regular' ? 'Regular products' : 
                         labelName === 'Featured' ? 'Featured products' :
                         labelName === 'New' ? 'New products' : 'Sale products',
          color: labelName === 'Regular' ? '#6B7280' :
                 labelName === 'Featured' ? '#F59E0B' :
                 labelName === 'New' ? '#10B981' : '#EF4444',
          store: storeId,
          isActive: true,
          sortOrder: labelName === 'Regular' ? 1 : 
                     labelName === 'Featured' ? 2 :
                     labelName === 'New' ? 3 : 4
        };
        
        label = new ProductLabel(labelData);
        await label.save();
        console.log(`✅ Created product label: ${labelName} (${label._id})`);
      } else {
        console.log(`✅ Using existing product label: ${labelName} (${label._id})`);
      }
      
      productLabels.push(label._id);
    }
    
    // Get product specifications for this store
    const productSpecifications = await ProductSpecification.find({ store: storeId });
    console.log(`✅ Found ${productSpecifications.length} product specifications for store`);
    
    if (productSpecifications.length === 0) {
      console.log('⚠️ No product specifications found. Please run addProductSpecsToStore.js first.');
    }
    
    // Clear ALL existing products for this store
    await Product.deleteMany({ store: storeId });
    console.log('✅ Cleared ALL existing products for store');
    
    // Update products with real IDs and multiple labels
    const productsWithRealIds = completeProducts.map((product, index) => {
      // Assign different labels to different products
      let labels = [];
      if (index === 0) labels = [productLabels[0], productLabels[1]]; // Regular + Featured
      else if (index === 1) labels = [productLabels[0], productLabels[3]]; // Regular + Sale
      else if (index === 2) labels = [productLabels[1], productLabels[2]]; // Featured + New
      else if (index === 3) labels = [productLabels[1], productLabels[3]]; // Featured + Sale
      else labels = [productLabels[0]]; // Regular only
      
      // Assign specifications based on product type
      let specifications = [];
      if (productSpecifications.length > 0) {
        if (index === 0) { // Shirt - assign size specifications
          specifications = productSpecifications.slice(0, 3).map(spec => spec._id); // طويل، قصير، كبير
        } else if (index === 1) { // Jeans - assign size specifications
          specifications = productSpecifications.slice(5, 8).map(spec => spec._id); // نمرة 40، نمرة 42، نمرة 44
        } else if (index === 2) { // Bag - assign general specifications
          specifications = productSpecifications.slice(3, 6).map(spec => spec._id); // وسط، صغير، نمرة 40
        }
      }
      
      return {
        ...product,
        category: testCategory._id,
        categoryPath: [testCategory._id],
        unit: testUnit._id,
        productLabels: labels,
        specifications: specifications
      };
    });
    
    // Create all products
    const createdProducts = await Product.insertMany(productsWithRealIds);
    console.log(`✅ Successfully created ${createdProducts.length} complete products`);
    
    // Display created products summary
    createdProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.nameEn} (${product.nameAr}):`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Barcodes: ${product.barcodes.join(', ')}`);
      console.log(`   Colors: ${product.colorOptionsCount} options`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Rating: ${product.rating}/5 (${product.numReviews} reviews)`);
      console.log(`   Labels: ${product.productLabels.length} labels`);
      console.log(`   Specifications: ${product.specifications.length} specifications`);
      console.log(`   ID: ${product._id}`);
    });
    
    console.log('\n=== Complete Product Data Summary ===');
    console.log(`✅ Store ID: ${storeId}`);
    console.log(`✅ Category ID: ${testCategory._id}`);
    console.log(`✅ Unit ID: ${testUnit._id}`);
    console.log(`✅ Product Labels: ${productLabels.length} labels created`);
    console.log(`✅ Total Products: ${createdProducts.length}`);
    console.log(`✅ All products include complete data with new structure`);
    
    return createdProducts;
    
  } catch (error) {
    console.error('❌ Error creating complete product data:', error);
    throw error;
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  createCompleteProductData()
    .then(() => {
      console.log('\n✅ Complete product data creation completed successfully!');
    })
    .catch((error) => {
      console.error('❌ Failed to create complete product data:', error);
      process.exit(1);
    });
}

module.exports = {
  completeProducts,
  createCompleteProductData
}; 