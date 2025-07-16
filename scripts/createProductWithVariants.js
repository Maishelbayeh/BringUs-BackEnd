const mongoose = require('mongoose');
const Product = require('../Models/Product');
const Category = require('../Models/Category');
const Unit = require('../Models/Unit');
const ProductLabel = require('../Models/ProductLabel');
const ProductSpecification = require('../Models/ProductSpecification');

// Connect to MongoDB
mongoose.connect('mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const STORE_ID = '687505893fbf3098648bfe16'; // Store ID for testing

async function createProductWithVariants() {
  try {
    console.log('🔍 Starting to create product with variants...');
    console.log('📋 Structure: Parent Product (hasVariants: true) -> Variants (hasVariants: false)');

    // Get or create category
    let category = await Category.findOne({ store: STORE_ID });
    if (!category) {
      category = new Category({
        nameAr: 'الإلكترونيات',
        nameEn: 'Electronics',
        store: STORE_ID,
        isActive: true
      });
      await category.save();
      console.log('✅ Created category:', category.nameEn);
    }

    // Get or create unit
    let unit = await Unit.findOne({ store: STORE_ID });
    if (!unit) {
      unit = new Unit({
        nameAr: 'قطعة',
        nameEn: 'Piece',
        symbol: 'pc',
        store: STORE_ID,
        isActive: true
      });
      await unit.save();
      console.log('✅ Created unit:', unit.nameEn);
    }

    // Get or create product labels
    let labels = await ProductLabel.find({ store: STORE_ID }).limit(2);
    if (labels.length === 0) {
      const label1 = new ProductLabel({
        nameAr: 'جديد',
        nameEn: 'New',
        color: '#10B981',
        store: STORE_ID,
        isActive: true
      });
      await label1.save();

      const label2 = new ProductLabel({
        nameAr: 'مميز',
        nameEn: 'Featured',
        color: '#F59E0B',
        store: STORE_ID,
        isActive: true
      });
      await label2.save();

      labels = [label1, label2];
      console.log('✅ Created product labels');
    }

    // Create Product Specifications
    let storageSpec = await ProductSpecification.findOne({ 
      titleEn: 'Storage', 
      store: STORE_ID 
    });
    if (!storageSpec) {
      storageSpec = new ProductSpecification({
        titleAr: 'السعة التخزينية',
        titleEn: 'Storage',
        values: [
          { valueAr: '128 جيجا', valueEn: '128GB' },
          { valueAr: '256 جيجا', valueEn: '256GB' },
          { valueAr: '512 جيجا', valueEn: '512GB' },
          { valueAr: '1 تيرا', valueEn: '1TB' }
        ],
        category: category._id,
        store: STORE_ID,
        isActive: true,
        sortOrder: 1
      });
      await storageSpec.save();
      console.log('✅ Created storage specification');
    }

    let colorSpec = await ProductSpecification.findOne({ 
      titleEn: 'Color', 
      store: STORE_ID 
    });
    if (!colorSpec) {
      colorSpec = new ProductSpecification({
        titleAr: 'اللون',
        titleEn: 'Color',
        values: [
          { valueAr: 'أسود', valueEn: 'Black' },
          { valueAr: 'أبيض', valueEn: 'White' },
          { valueAr: 'فضي', valueEn: 'Silver' },
          { valueAr: 'ذهبي', valueEn: 'Gold' },
          { valueAr: 'أزرق', valueEn: 'Blue' }
        ],
        category: category._id,
        store: STORE_ID,
        isActive: true,
        sortOrder: 2
      });
      await colorSpec.save();
      console.log('✅ Created color specification');
    }

    console.log('\n📱 Creating iPhone 15 (Parent Product) with variants...');

    // ========================================
    // 1. CREATE PARENT PRODUCT (iPhone 15)
    // ========================================
    const iphone15Parent = new Product({
      nameAr: 'آيفون 15',
      nameEn: 'iPhone 15',
      descriptionAr: 'هاتف ذكي متطور من أبل مع كاميرا احترافية',
      descriptionEn: 'Advanced smartphone from Apple with professional camera',
      price: 0, // Parent product doesn't have a specific price
      costPrice: 0,
      compareAtPrice: 0,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 0, // Total will be sum of variants
      stock: 0,
      visibility: true,
      isActive: true,
      hasVariants: true, // ✅ This is a parent product
      variants: [], // Will be populated after creating variants
      barcodes: [], // Parent doesn't have specific barcode
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      productLabels: labels.map(l => l._id),
      colors: [['#000000'], ['#FFFFFF'], ['#C0C0C0']], // All available colors
      productOrder: 1
    });

    await iphone15Parent.save();
    console.log('✅ Created PARENT product:', iphone15Parent.nameEn, '(hasVariants: true)');

    // ========================================
    // 2. CREATE VARIANTS (Separate Products)
    // ========================================
    console.log('\n📱 Creating iPhone 15 variants...');

    // Variant 1: iPhone 15 - 128GB - Black
    const variant1 = new Product({
      nameAr: 'آيفون 15 - 128 جيجا - أسود',
      nameEn: 'iPhone 15 - 128GB - Black',
      descriptionAr: 'آيفون 15 بسعة 128 جيجا باللون الأسود',
      descriptionEn: 'iPhone 15 with 128GB storage in Black color',
      price: 999, // ✅ Variant has specific price
      costPrice: 800,
      compareAtPrice: 1099,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 20, // ✅ Variant has specific stock
      stock: 20,
      visibility: true,
      isActive: true,
      hasVariants: false, // ✅ This is a variant (cannot have variants)
      variants: [], // Variants cannot have their own variants
      barcodes: ['1234567890124'], // ✅ Variant has specific barcode
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      productLabels: [labels[0]._id],
      colors: [['#000000']], // Only black color
      productOrder: 1,
      specificationValues: [
        {
          specificationId: storageSpec._id,
          valueId: 'storage_128',
          value: '128GB',
          title: 'Storage'
        },
        {
          specificationId: colorSpec._id,
          valueId: 'color_black',
          value: 'Black',
          title: 'Color'
        }
      ]
    });

    await variant1.save();
    console.log('✅ Created VARIANT 1:', variant1.nameEn, '(hasVariants: false)');

    // Variant 2: iPhone 15 - 256GB - White
    const variant2 = new Product({
      nameAr: 'آيفون 15 - 256 جيجا - أبيض',
      nameEn: 'iPhone 15 - 256GB - White',
      descriptionAr: 'آيفون 15 بسعة 256 جيجا باللون الأبيض',
      descriptionEn: 'iPhone 15 with 256GB storage in White color',
      price: 1099,
      costPrice: 900,
      compareAtPrice: 1199,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 15,
      stock: 15,
      visibility: true,
      isActive: true,
      hasVariants: false,
      variants: [],
      barcodes: ['1234567890125'],
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      productLabels: [labels[1]._id],
      colors: [['#FFFFFF']], // Only white color
      productOrder: 2,
      specificationValues: [
        {
          specificationId: storageSpec._id,
          valueId: 'storage_256',
          value: '256GB',
          title: 'Storage'
        },
        {
          specificationId: colorSpec._id,
          valueId: 'color_white',
          value: 'White',
          title: 'Color'
        }
      ]
    });

    await variant2.save();
    console.log('✅ Created VARIANT 2:', variant2.nameEn, '(hasVariants: false)');

    // Variant 3: iPhone 15 - 512GB - Silver
    const variant3 = new Product({
      nameAr: 'آيفون 15 - 512 جيجا - فضي',
      nameEn: 'iPhone 15 - 512GB - Silver',
      descriptionAr: 'آيفون 15 بسعة 512 جيجا باللون الفضي',
      descriptionEn: 'iPhone 15 with 512GB storage in Silver color',
      price: 1299,
      costPrice: 1100,
      compareAtPrice: 1399,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 10,
      stock: 10,
      visibility: true,
      isActive: true,
      hasVariants: false,
      variants: [],
      barcodes: ['1234567890126'],
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      productLabels: labels.map(l => l._id),
      colors: [['#C0C0C0']], // Only silver color
      productOrder: 3,
      specificationValues: [
        {
          specificationId: storageSpec._id,
          valueId: 'storage_512',
          value: '512GB',
          title: 'Storage'
        },
        {
          specificationId: colorSpec._id,
          valueId: 'color_silver',
          value: 'Silver',
          title: 'Color'
        }
      ]
    });

    await variant3.save();
    console.log('✅ Created VARIANT 3:', variant3.nameEn, '(hasVariants: false)');

    // ========================================
    // 3. LINK VARIANTS TO PARENT
    // ========================================
    console.log('\n🔗 Linking variants to parent product...');
    
    // Update parent product with variant IDs
    iphone15Parent.variants = [variant1._id, variant2._id, variant3._id];
    await iphone15Parent.save();
    console.log('✅ Linked 3 variants to iPhone 15 parent');

    // ========================================
    // 4. CREATE ANOTHER PARENT PRODUCT
    // ========================================
    console.log('\n📱 Creating Samsung Galaxy S24 (Parent Product) with variant...');

    const samsungParent = new Product({
      nameAr: 'سامسونج جالكسي S24',
      nameEn: 'Samsung Galaxy S24',
      descriptionAr: 'هاتف ذكي متطور من سامسونج مع شاشة عالية الدقة',
      descriptionEn: 'Advanced smartphone from Samsung with high-resolution display',
      price: 0,
      costPrice: 0,
      compareAtPrice: 0,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 0,
      stock: 0,
      visibility: true,
      isActive: true,
      hasVariants: true,
      variants: [],
      barcodes: [],
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
      productLabels: [labels[1]._id],
      colors: [['#000000'], ['#FFFFFF']],
      productOrder: 2
    });

    await samsungParent.save();
    console.log('✅ Created PARENT product:', samsungParent.nameEn, '(hasVariants: true)');

    // Samsung Variant
    const samsungVariant = new Product({
      nameAr: 'سامسونج جالكسي S24 - 128 جيجا - أسود',
      nameEn: 'Samsung Galaxy S24 - 128GB - Black',
      descriptionAr: 'سامسونج جالكسي S24 بسعة 128 جيجا باللون الأسود',
      descriptionEn: 'Samsung Galaxy S24 with 128GB storage in Black color',
      price: 899,
      costPrice: 700,
      compareAtPrice: 999,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 15,
      stock: 15,
      visibility: true,
      isActive: true,
      hasVariants: false,
      variants: [],
      barcodes: ['1234567890128'],
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
      productLabels: [labels[0]._id],
      colors: [['#000000']],
      productOrder: 1,
      specificationValues: [
        {
          specificationId: storageSpec._id,
          valueId: 'storage_128',
          value: '128GB',
          title: 'Storage'
        },
        {
          specificationId: colorSpec._id,
          valueId: 'color_black',
          value: 'Black',
          title: 'Color'
        }
      ]
    });

    await samsungVariant.save();
    console.log('✅ Created Samsung VARIANT:', samsungVariant.nameEn, '(hasVariants: false)');

    // Link Samsung variant to parent
    samsungParent.variants = [samsungVariant._id];
    await samsungParent.save();
    console.log('✅ Linked 1 variant to Samsung parent');

    // ========================================
    // 5. CREATE REGULAR PRODUCT (NO VARIANTS)
    // ========================================
    console.log('\n📱 Creating regular product (no variants)...');

    const regularProduct = new Product({
      nameAr: 'سماعات أبل إيربودس',
      nameEn: 'Apple AirPods',
      descriptionAr: 'سماعات لاسلكية من أبل مع جودة صوت عالية',
      descriptionEn: 'Wireless headphones from Apple with high sound quality',
      price: 199,
      costPrice: 150,
      compareAtPrice: 249,
      category: category._id,
      unit: unit._id,
      store: STORE_ID,
      availableQuantity: 100,
      stock: 100,
      visibility: true,
      isActive: true,
      hasVariants: false, // ✅ Regular product (no variants)
      variants: [],
      barcodes: ['1234567890129'],
      images: [
        'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400'
      ],
      mainImage: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400',
      productLabels: [labels[0]._id],
      colors: [['#FFFFFF']],
      productOrder: 3
    });

    await regularProduct.save();
    console.log('✅ Created REGULAR product:', regularProduct.nameEn, '(hasVariants: false)');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n🎉 Successfully created test data!');
    console.log('\n📊 PRODUCT STRUCTURE:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ PARENT PRODUCTS (hasVariants: true)                     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 📱 iPhone 15                                            │');
    console.log('│    ├─ 128GB Black  ($999)                              │');
    console.log('│    ├─ 256GB White  ($1099)                             │');
    console.log('│    └─ 512GB Silver ($1299)                             │');
    console.log('│                                                         │');
    console.log('│ 📱 Samsung Galaxy S24                                  │');
    console.log('│    └─ 128GB Black  ($899)                              │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ REGULAR PRODUCTS (hasVariants: false)                   │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 🎧 Apple AirPods ($199)                                │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n🔍 In Table View: Only Parent + Regular products');
    console.log('🌳 In Tree View: Parent products with expandable variants');
    console.log('\n✅ Ready to test in frontend!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createProductWithVariants(); 