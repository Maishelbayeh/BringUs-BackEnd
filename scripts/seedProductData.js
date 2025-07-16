const mongoose = require('mongoose');
const Category = require('../Models/Category');
const ProductLabel = require('../Models/ProductLabel');
const Unit = require('../Models/Unit');
const ProductSpecification = require('../Models/ProductSpecification');
const Product = require('../Models/Product');
const ProductVariant = require('../Models/ProductVariant');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedData = async () => {
  try {
    //CONSOLE.log('Starting to seed product data...');

    // Clear existing data
    await Category.deleteMany({});
    await ProductLabel.deleteMany({});
    await Unit.deleteMany({});
    await ProductSpecification.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});

    //CONSOLE.log('Cleared existing data');

    // Seed Product Labels
    const productLabels = await ProductLabel.insertMany([
      { nameAr: 'عادي', nameEn: 'Regular', color: '#6B7280', sortOrder: 1 },
      { nameAr: 'عرض', nameEn: 'Offer', color: '#EF4444', sortOrder: 2 },
      { nameAr: 'مميز', nameEn: 'Featured', color: '#F59E0B', sortOrder: 3 },
      { nameAr: 'جديد', nameEn: 'New', color: '#10B981', sortOrder: 4 }
    ]);
    //CONSOLE.log('Product labels seeded');

    // Seed Units
    const units = await Unit.insertMany([
      { nameAr: 'قطعة', nameEn: 'Piece', symbol: 'pc', sortOrder: 1 },
      { nameAr: 'كيلوغرام', nameEn: 'Kilogram', symbol: 'kg', sortOrder: 2 },
      { nameAr: 'لتر', nameEn: 'Liter', symbol: 'L', sortOrder: 3 },
      { nameAr: 'متر', nameEn: 'Meter', symbol: 'm', sortOrder: 4 },
      { nameAr: 'زوج', nameEn: 'Pair', symbol: 'pair', sortOrder: 5 },
      { nameAr: 'علبة', nameEn: 'Box', symbol: 'box', sortOrder: 6 },
      { nameAr: 'عبوة', nameEn: 'Pack', symbol: 'pack', sortOrder: 7 },
      { nameAr: 'زجاجة', nameEn: 'Bottle', symbol: 'bottle', sortOrder: 8 },
      { nameAr: 'كوب', nameEn: 'Cup', symbol: 'cup', sortOrder: 9 },
      { nameAr: 'ملعقة', nameEn: 'Spoon', symbol: 'spoon', sortOrder: 10 },
      { nameAr: 'كوب', nameEn: 'Glass', symbol: 'glass', sortOrder: 11 },
      { nameAr: 'صحن', nameEn: 'Plate', symbol: 'plate', sortOrder: 12 },
      { nameAr: 'طبق', nameEn: 'Dish', symbol: 'dish', sortOrder: 13 },
      { nameAr: 'قطعة', nameEn: 'Item', symbol: 'item', sortOrder: 14 },
      { nameAr: 'مجموعة', nameEn: 'Set', symbol: 'set', sortOrder: 15 },
      { nameAr: 'حزمة', nameEn: 'Bundle', symbol: 'bundle', sortOrder: 16 },
      { nameAr: 'لفة', nameEn: 'Roll', symbol: 'roll', sortOrder: 17 },
      { nameAr: 'ورقة', nameEn: 'Sheet', symbol: 'sheet', sortOrder: 18 },
      { nameAr: 'كتاب', nameEn: 'Book', symbol: 'book', sortOrder: 19 },
      { nameAr: 'مجلة', nameEn: 'Magazine', symbol: 'mag', sortOrder: 20 },
      { nameAr: 'لعبة', nameEn: 'Toy', symbol: 'toy', sortOrder: 21 },
      { nameAr: 'قطعة', nameEn: 'Unit', symbol: 'unit', sortOrder: 22 }
    ]);
    //CONSOLE.log('Units seeded');

    // Seed Categories (hierarchical structure)
    const categories = await Category.insertMany([
      // Main categories
      { 
        nameAr: 'الكترونيات', 
        nameEn: 'Electronics', 
        slug: 'electronics',
        descriptionAr: 'كل ما يتعلق بالأجهزة الإلكترونية والتقنية الحديثة.',
        descriptionEn: 'All about electronics and modern technology.',
        level: 0,
        sortOrder: 1,
        parent: null
      },
      { 
        nameAr: 'ملابس', 
        nameEn: 'Clothes', 
        slug: 'clothes',
        descriptionAr: 'ملابس رجالية ونسائية وأطفال.',
        descriptionEn: 'Men, women, and kids clothing.',
        level: 0,
        sortOrder: 2,
        parent: null
      },
      { 
        nameAr: 'أثاث', 
        nameEn: 'Furniture', 
        slug: 'furniture',
        descriptionAr: 'أثاث منزلي ومكتبي.',
        descriptionEn: 'Home and office furniture.',
        level: 0,
        sortOrder: 3,
        parent: null
      },
      { 
        nameAr: 'كتب', 
        nameEn: 'Books', 
        slug: 'books',
        descriptionAr: 'كتب لجميع الأعمار والاهتمامات.',
        descriptionEn: 'Books for all ages and interests.',
        level: 0,
        sortOrder: 4,
        parent: null
      },
      { 
        nameAr: 'أطعمة', 
        nameEn: 'Food', 
        slug: 'food',
        descriptionAr: 'منتجات غذائية طازجة ومعلبة.',
        descriptionEn: 'Fresh and canned food products.',
        level: 0,
        sortOrder: 5,
        parent: null
      }
    ]);

    // Get main categories for subcategories
    const electronics = categories.find(c => c.slug === 'electronics');
    const clothes = categories.find(c => c.slug === 'clothes');
    const furniture = categories.find(c => c.slug === 'furniture');
    const books = categories.find(c => c.slug === 'books');
    const food = categories.find(c => c.slug === 'food');

    // Subcategories
    const subcategories = await Category.insertMany([
      // Electronics subcategories
      { 
        nameAr: 'هواتف', 
        nameEn: 'Phones', 
        slug: 'phones',
        descriptionAr: 'جميع أنواع الهواتف الذكية والعادية.',
        descriptionEn: 'All types of smartphones and regular phones.',
        level: 1,
        sortOrder: 1,
        parent: electronics._id
      },
      { 
        nameAr: 'لابتوبات', 
        nameEn: 'Laptops', 
        slug: 'laptops',
        descriptionAr: 'أحدث أجهزة الكمبيوتر المحمولة.',
        descriptionEn: 'Latest laptop computers.',
        level: 1,
        sortOrder: 2,
        parent: electronics._id
      },
      // Clothes subcategories
      { 
        nameAr: 'رجالي', 
        nameEn: 'Men', 
        slug: 'men-clothes',
        descriptionAr: 'ملابس وإكسسوارات رجالية.',
        descriptionEn: "Men's clothing and accessories.",
        level: 1,
        sortOrder: 1,
        parent: clothes._id
      },
      { 
        nameAr: 'نسائي', 
        nameEn: 'Women', 
        slug: 'women-clothes',
        descriptionAr: 'ملابس وإكسسوارات نسائية.',
        descriptionEn: "Women's clothing and accessories.",
        level: 1,
        sortOrder: 2,
        parent: clothes._id
      },
      // Furniture subcategories
      { 
        nameAr: 'غرف نوم', 
        nameEn: 'Bedrooms', 
        slug: 'bedrooms',
        descriptionAr: 'أسرة وخزائن ومستلزمات النوم.',
        descriptionEn: 'Beds, wardrobes, and sleep accessories.',
        level: 1,
        sortOrder: 1,
        parent: furniture._id
      },
      { 
        nameAr: 'غرف جلوس', 
        nameEn: 'Living Rooms', 
        slug: 'living-rooms',
        descriptionAr: 'كنب وطاولات ومجالس.',
        descriptionEn: 'Sofas, tables, and living room setups.',
        level: 1,
        sortOrder: 2,
        parent: furniture._id
      },
      // Books subcategories
      { 
        nameAr: 'روايات', 
        nameEn: 'Novels', 
        slug: 'novels',
        descriptionAr: 'روايات عربية وأجنبية.',
        descriptionEn: 'Arabic and international novels.',
        level: 1,
        sortOrder: 1,
        parent: books._id
      },
      { 
        nameAr: 'كتب أطفال', 
        nameEn: 'Children Books', 
        slug: 'children-books',
        descriptionAr: 'قصص وكتب تعليمية للأطفال.',
        descriptionEn: 'Stories and learning books for children.',
        level: 1,
        sortOrder: 2,
        parent: books._id
      },
      // Food subcategories
      { 
        nameAr: 'خضروات', 
        nameEn: 'Vegetables', 
        slug: 'vegetables',
        descriptionAr: 'خضروات طازجة يومياً.',
        descriptionEn: 'Fresh daily vegetables.',
        level: 1,
        sortOrder: 1,
        parent: food._id
      },
      { 
        nameAr: 'فواكه', 
        nameEn: 'Fruits', 
        slug: 'fruits',
        descriptionAr: 'أجود أنواع الفاكهة.',
        descriptionEn: 'Best quality fruits.',
        level: 1,
        sortOrder: 2,
        parent: food._id
      }
    ]);

    // Get subcategories for sub-subcategories
    const phones = subcategories.find(c => c.slug === 'phones');
    const menClothes = subcategories.find(c => c.slug === 'men-clothes');
    const womenClothes = subcategories.find(c => c.slug === 'women-clothes');

    // Sub-subcategories
    const subSubcategories = await Category.insertMany([
      // Phone sub-subcategories
      { 
        nameAr: 'أندرويد', 
        nameEn: 'Android', 
        slug: 'android-phones',
        descriptionAr: 'هواتف تعمل بنظام أندرويد من مختلف الشركات.',
        descriptionEn: 'Phones running Android OS from various brands.',
        level: 2,
        sortOrder: 1,
        parent: phones._id
      },
      { 
        nameAr: 'آيفون', 
        nameEn: 'iPhone', 
        slug: 'iphone-phones',
        descriptionAr: 'هواتف آيفون من شركة أبل.',
        descriptionEn: 'iPhones from Apple.',
        level: 2,
        sortOrder: 2,
        parent: phones._id
      },
      { 
        nameAr: 'هواتف مستعملة', 
        nameEn: 'Used Phones', 
        slug: 'used-phones',
        descriptionAr: 'هواتف مستعملة بحالة جيدة وبأسعار مناسبة.',
        descriptionEn: 'Used phones in good condition at reasonable prices.',
        level: 2,
        sortOrder: 3,
        parent: phones._id
      },
      { 
        nameAr: 'إكسسوارات الهواتف', 
        nameEn: 'Phone Accessories', 
        slug: 'phone-accessories',
        descriptionAr: 'كفرات، سماعات، شواحن، وغيرها من الإكسسوارات.',
        descriptionEn: 'Covers, headsets, chargers, and other accessories.',
        level: 2,
        sortOrder: 4,
        parent: phones._id
      }
    ]);

    //CONSOLE.log('Categories seeded');

    // Seed Product Specifications
    const specifications = await ProductSpecification.insertMany([
      { descriptionAr: 'طويل', descriptionEn: 'Long', category: menClothes._id, sortOrder: 1 },
      { descriptionAr: 'قصير', descriptionEn: 'Short', category: menClothes._id, sortOrder: 2 },
      { descriptionAr: 'كبير', descriptionEn: 'Large', category: menClothes._id, sortOrder: 3 },
      { descriptionAr: 'وسط', descriptionEn: 'Medium', category: menClothes._id, sortOrder: 4 },
      { descriptionAr: 'صغير', descriptionEn: 'Small', category: menClothes._id, sortOrder: 5 },
      { descriptionAr: 'نمرة 40', descriptionEn: 'Size 40', category: menClothes._id, sortOrder: 6 },
      { descriptionAr: 'نمرة 42', descriptionEn: 'Size 42', category: menClothes._id, sortOrder: 7 },
      { descriptionAr: 'نمرة 44', descriptionEn: 'Size 44', category: menClothes._id, sortOrder: 8 },
      { descriptionAr: 'عريض', descriptionEn: 'Wide', category: menClothes._id, sortOrder: 9 },
      { descriptionAr: 'ضيق', descriptionEn: 'Narrow', category: menClothes._id, sortOrder: 10 }
    ]);
    //CONSOLE.log('Product specifications seeded');

    // Get specific categories and units for products
    const android = subSubcategories.find(c => c.slug === 'android-phones');
    const iphone = subSubcategories.find(c => c.slug === 'iphone-phones');
    const laptops = subcategories.find(c => c.slug === 'laptops');
    const menClothing = subcategories.find(c => c.slug === 'men-clothes');
    const womenClothing = subcategories.find(c => c.slug === 'women-clothes');
    const novels = subcategories.find(c => c.slug === 'novels');
    const childrenBooks = subcategories.find(c => c.slug === 'children-books');
    const vegetables = subcategories.find(c => c.slug === 'vegetables');
    const fruits = subcategories.find(c => c.slug === 'fruits');

    const pieceUnit = units.find(u => u.symbol === 'unit');
    const kgUnit = units.find(u => u.symbol === 'kg');
    const bookUnit = units.find(u => u.symbol === 'book');
    const toyUnit = units.find(u => u.symbol === 'toy');

    const regularLabel = productLabels.find(l => l.nameEn === 'Regular');
    const offerLabel = productLabels.find(l => l.nameEn === 'Offer');
    const featuredLabel = productLabels.find(l => l.nameEn === 'Featured');
    const newLabel = productLabels.find(l => l.nameEn === 'New');

    // Seed Products
    const products = await Product.insertMany([
      {
        nameAr: 'سامسونج جالاكسي S22',
        nameEn: 'Samsung Galaxy S22',
        descriptionAr: 'سامسونج جالاكسي S22',
        descriptionEn: 'Samsung Galaxy S22',
        price: 2500,
        category: android._id,
        categoryPath: [electronics._id, phones._id, android._id],
        productLabel: regularLabel._id,
        unit: pieceUnit._id,
        availableQuantity: 980,
        productOrder: 1,
        visibility: true,
        brand: 'Samsung',
        sku: 'SAMS22-001',
        stock: 980,
        images: [{
          public_id: 'sample_public_id_1',
          url: 'https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Samsung Galaxy S22'
        }],
        mainImage: {
          public_id: 'sample_public_id_1',
          url: 'https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Samsung Galaxy S22'
        }
      },
      {
        nameAr: 'آيفون 14 برو',
        nameEn: 'iPhone 14 Pro',
        descriptionAr: 'آيفون 14 برو',
        descriptionEn: 'iPhone 14 Pro',
        price: 4500,
        category: iphone._id,
        categoryPath: [electronics._id, phones._id, iphone._id],
        productLabel: regularLabel._id,
        unit: pieceUnit._id,
        availableQuantity: 980,
        productOrder: 2,
        visibility: true,
        brand: 'Apple',
        sku: 'IPH14P-001',
        stock: 980,
        images: [{
          public_id: 'sample_public_id_2',
          url: 'https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'iPhone 14 Pro'
        }],
        mainImage: {
          public_id: 'sample_public_id_2',
          url: 'https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'iPhone 14 Pro'
        }
      },
      {
        nameAr: 'لابتوب ديل XPS',
        nameEn: 'Dell XPS Laptop',
        descriptionAr: 'لابتوب ديل XPS',
        descriptionEn: 'Dell XPS Laptop',
        price: 5200,
        category: laptops._id,
        categoryPath: [electronics._id, laptops._id],
        productLabel: offerLabel._id,
        unit: pieceUnit._id,
        availableQuantity: 10,
        productOrder: 3,
        visibility: true,
        brand: 'Dell',
        sku: 'DELLXPS-001',
        stock: 10,
        images: [{
          public_id: 'sample_public_id_3',
          url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Dell XPS Laptop'
        }],
        mainImage: {
          public_id: 'sample_public_id_3',
          url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Dell XPS Laptop'
        }
      },
      {
        nameAr: 'تيشيرت قطني',
        nameEn: 'Cotton T-Shirt',
        descriptionAr: 'تيشيرت قطني',
        descriptionEn: 'Cotton T-Shirt',
        price: 90,
        category: menClothing._id,
        categoryPath: [clothes._id, menClothing._id],
        productLabel: offerLabel._id,
        unit: pieceUnit._id,
        availableQuantity: 30,
        productOrder: 4,
        visibility: true,
        brand: 'Generic',
        sku: 'TSHIRT-001',
        stock: 30,
        images: [{
          public_id: 'sample_public_id_4',
          url: 'https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Cotton T-Shirt'
        }],
        mainImage: {
          public_id: 'sample_public_id_4',
          url: 'https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Cotton T-Shirt'
        }
      },
      {
        nameAr: 'رواية نجيب محفوظ',
        nameEn: 'Naguib Mahfouz Novel',
        descriptionAr: 'رواية نجيب محفوظ',
        descriptionEn: 'Naguib Mahfouz Novel',
        price: 40,
        category: novels._id,
        categoryPath: [books._id, novels._id],
        productLabel: newLabel._id,
        unit: bookUnit._id,
        availableQuantity: 0,
        productOrder: 5,
        visibility: false,
        brand: 'Naguib Mahfouz',
        sku: 'BOOK-001',
        stock: 0,
        images: [{
          public_id: 'sample_public_id_5',
          url: 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Naguib Mahfouz Novel'
        }],
        mainImage: {
          public_id: 'sample_public_id_5',
          url: 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Naguib Mahfouz Novel'
        }
      }
    ]);

    //CONSOLE.log('Products seeded');

    // Seed Product Variants
    const variants = await ProductVariant.insertMany([
      {
        productId: products[0]._id, // Samsung Galaxy S22
        name: '128GB Black',
        price: 2500,
        sku: 'SAMS22-128-BLK',
        stock: 500,
        colors: ['#000000'],
        isDefault: true
      },
      {
        productId: products[0]._id, // Samsung Galaxy S22
        name: '256GB White',
        price: 2700,
        sku: 'SAMS22-256-WHT',
        stock: 480,
        colors: ['#FFFFFF']
      },
      {
        productId: products[1]._id, // iPhone 14 Pro
        name: '128GB Space Black',
        price: 4500,
        sku: 'IPH14P-128-BLK',
        stock: 500,
        colors: ['#000000'],
        isDefault: true
      },
      {
        productId: products[1]._id, // iPhone 14 Pro
        name: '256GB Silver',
        price: 4800,
        sku: 'IPH14P-256-SLV',
        stock: 480,
        colors: ['#C0C0C0']
      }
    ]);

    //CONSOLE.log('Product variants seeded');

    //CONSOLE.log('✅ All product data seeded successfully!');
    //CONSOLE.log(`📊 Summary:`);
    //CONSOLE.log(`   - Product Labels: ${productLabels.length}`);
    //CONSOLE.log(`   - Units: ${units.length}`);
    //CONSOLE.log(`   - Categories: ${categories.length + subcategories.length + subSubcategories.length}`);
    //CONSOLE.log(`   - Product Specifications: ${specifications.length}`);
    //CONSOLE.log(`   - Products: ${products.length}`);
    //CONSOLE.log(`   - Product Variants: ${variants.length}`);

  } catch (error) {
    //CONSOLE.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData(); 