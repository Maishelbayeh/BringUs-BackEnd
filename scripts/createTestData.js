const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../Models/User');
const Store = require('../Models/Store');
const Owner = require('../Models/Owner');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
const ProductLabel = require('../Models/ProductLabel');
const Unit = require('../Models/Unit');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function createTestData() {
  try {
    //CONSOLE.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB\n');

    // Clear existing test data
    //CONSOLE.log('🧹 Clearing existing test data...');
    await User.deleteMany({ email: { $regex: /test/ } });
    await Store.deleteMany({ domain: { $regex: /test/ } });
    await Owner.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ProductLabel.deleteMany({});
    await Unit.deleteMany({});
    //CONSOLE.log('✅ Test data cleared\n');

    // Create Store 1: TechStore
    //CONSOLE.log('🏪 Creating TechStore...');
    const techStore = new Store({
      name: 'TechStore',
      description: 'Your one-stop shop for all things tech',
      domain: 'techstore-test',
      status: 'active',
      settings: {
        currency: 'USD',
        language: 'en',
        timezone: 'UTC'
      },
      contact: {
        email: 'contact@techstore.com',
        phone: '+1234567890',
        address: {
          street: '123 Tech Street',
          city: 'Silicon Valley',
          state: 'CA',
          zipCode: '94025',
          country: 'USA'
        }
      }
    });
    await techStore.save();
    //CONSOLE.log('✅ TechStore created:', techStore._id);

    // Create Store 2: FashionStore
    //CONSOLE.log('\n🏪 Creating FashionStore...');
    const fashionStore = new Store({
      name: 'FashionStore',
      description: 'Trendy fashion for everyone',
      domain: 'fashionstore-test',
      status: 'active',
      settings: {
        currency: 'USD',
        language: 'en',
        timezone: 'UTC'
      },
      contact: {
        email: 'contact@fashionstore.com',
        phone: '+1234567891',
        address: {
          street: '456 Fashion Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      }
    });
    await fashionStore.save();
    //CONSOLE.log('✅ FashionStore created:', fashionStore._id);

    // Create Users for TechStore
    //CONSOLE.log('\n👥 Creating users for TechStore...');
    const techUsers = [];
    
    // TechStore Owner
    const techOwner = new User({
      firstName: 'Ahmed',
      lastName: 'Tech',
      email: 'ahmed.tech@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      status: 'active',
      phone: '+1234567890'
    });
    await techOwner.save();
    techUsers.push(techOwner);

    // TechStore Admin
    const techAdmin = new User({
      firstName: 'Sara',
      lastName: 'Tech',
      email: 'sara.tech@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      status: 'active',
      phone: '+1234567891'
    });
    await techAdmin.save();
    techUsers.push(techAdmin);

    // TechStore Staff
    const techStaff = new User({
      firstName: 'Omar',
      lastName: 'Tech',
      email: 'omar.tech@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'client',
      status: 'active',
      phone: '+1234567892'
    });
    await techStaff.save();
    techUsers.push(techStaff);

    //CONSOLE.log('✅ TechStore users created');

    // Create Users for FashionStore
    //CONSOLE.log('\n👥 Creating users for FashionStore...');
    const fashionUsers = [];
    
    // FashionStore Owner
    const fashionOwner = new User({
      firstName: 'Fatima',
      lastName: 'Fashion',
      email: 'fatima.fashion@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      status: 'active',
      phone: '+1234567893'
    });
    await fashionOwner.save();
    fashionUsers.push(fashionOwner);

    // FashionStore Admin
    const fashionAdmin = new User({
      firstName: 'Layla',
      lastName: 'Fashion',
      email: 'layla.fashion@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      status: 'active',
      phone: '+1234567894'
    });
    await fashionAdmin.save();
    fashionUsers.push(fashionAdmin);

    // FashionStore Staff
    const fashionStaff = new User({
      firstName: 'Youssef',
      lastName: 'Fashion',
      email: 'youssef.fashion@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'client',
      status: 'active',
      phone: '+1234567895'
    });
    await fashionStaff.save();
    fashionUsers.push(fashionStaff);

    //CONSOLE.log('✅ FashionStore users created');

    // Create Owners
    //CONSOLE.log('\n👑 Creating store owners...');
    
    // TechStore Owners
    await new Owner({
      userId: techOwner._id,
      storeId: techStore._id,
      permissions: [
        'manage_store',
        'manage_users',
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_inventory',
        'view_analytics',
        'manage_settings'
      ],
      isPrimaryOwner: true,
      status: 'active'
    }).save();

    await new Owner({
      userId: techAdmin._id,
      storeId: techStore._id,
      permissions: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_inventory',
        'view_analytics'
      ],
      isPrimaryOwner: false,
      status: 'active'
    }).save();

    await new Owner({
      userId: techStaff._id,
      storeId: techStore._id,
      permissions: [
        'manage_products',
        'view_analytics'
      ],
      isPrimaryOwner: false,
      status: 'active'
    }).save();

    // FashionStore Owners
    await new Owner({
      userId: fashionOwner._id,
      storeId: fashionStore._id,
      permissions: [
        'manage_store',
        'manage_users',
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_inventory',
        'view_analytics',
        'manage_settings'
      ],
      isPrimaryOwner: true,
      status: 'active'
    }).save();

    await new Owner({
      userId: fashionAdmin._id,
      storeId: fashionStore._id,
      permissions: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_inventory',
        'view_analytics'
      ],
      isPrimaryOwner: false,
      status: 'active'
    }).save();

    await new Owner({
      userId: fashionStaff._id,
      storeId: fashionStore._id,
      permissions: [
        'manage_products',
        'view_analytics'
      ],
      isPrimaryOwner: false,
      status: 'active'
    }).save();

    //CONSOLE.log('✅ Store owners created');

    // Create Product Labels for TechStore
    //CONSOLE.log('\n🏷️ Creating product labels for TechStore...');
    const techLabels = [];
    
    const techRegularLabel = new ProductLabel({
      nameAr: "عادي",
      nameEn: "Regular",
      descriptionAr: "منتج عادي",
      descriptionEn: "Regular product",
      color: "#6B7280",
      store: techStore._id,
      sortOrder: 1
    });
    await techRegularLabel.save();
    techLabels.push(techRegularLabel);

    const techFeaturedLabel = new ProductLabel({
      nameAr: "مميز",
      nameEn: "Featured",
      descriptionAr: "منتج مميز",
      descriptionEn: "Featured product",
      color: "#EF4444",
      store: techStore._id,
      sortOrder: 2
    });
    await techFeaturedLabel.save();
    techLabels.push(techFeaturedLabel);

    const techNewLabel = new ProductLabel({
      nameAr: "جديد",
      nameEn: "New",
      descriptionAr: "منتج جديد",
      descriptionEn: "New product",
      color: "#10B981",
      store: techStore._id,
      sortOrder: 3
    });
    await techNewLabel.save();
    techLabels.push(techNewLabel);

    //CONSOLE.log('✅ TechStore labels created');

    // Create Product Labels for FashionStore
    //CONSOLE.log('\n🏷️ Creating product labels for FashionStore...');
    const fashionLabels = [];
    
    const fashionRegularLabel = new ProductLabel({
      nameAr: "عادي",
      nameEn: "Regular",
      descriptionAr: "منتج عادي",
      descriptionEn: "Regular product",
      color: "#6B7280",
      store: fashionStore._id,
      sortOrder: 1
    });
    await fashionRegularLabel.save();
    fashionLabels.push(fashionRegularLabel);

    const fashionSaleLabel = new ProductLabel({
      nameAr: "تخفيض",
      nameEn: "Sale",
      descriptionAr: "منتج في تخفيض",
      descriptionEn: "Product on sale",
      color: "#F59E0B",
      store: fashionStore._id,
      sortOrder: 2
    });
    await fashionSaleLabel.save();
    fashionLabels.push(fashionSaleLabel);

    const fashionTrendyLabel = new ProductLabel({
      nameAr: "موضة",
      nameEn: "Trendy",
      descriptionAr: "منتج موضة",
      descriptionEn: "Trendy product",
      color: "#8B5CF6",
      store: fashionStore._id,
      sortOrder: 3
    });
    await fashionTrendyLabel.save();
    fashionLabels.push(fashionTrendyLabel);

    //CONSOLE.log('✅ FashionStore labels created');

    // Create Units for TechStore
    //CONSOLE.log('\n📦 Creating units for TechStore...');
    const techUnits = [];
    
    const techPieceUnit = new Unit({
      nameAr: "قطعة",
      nameEn: "Piece",
      symbol: "pc",
      descriptionAr: "وحدة قياس",
      descriptionEn: "Measurement unit",
      store: techStore._id,
      sortOrder: 1
    });
    await techPieceUnit.save();
    techUnits.push(techPieceUnit);

    const techBoxUnit = new Unit({
      nameAr: "صندوق",
      nameEn: "Box",
      symbol: "box",
      descriptionAr: "صندوق",
      descriptionEn: "Box",
      store: techStore._id,
      sortOrder: 2
    });
    await techBoxUnit.save();
    techUnits.push(techBoxUnit);

    //CONSOLE.log('✅ TechStore units created');

    // Create Units for FashionStore
    //CONSOLE.log('\n📦 Creating units for FashionStore...');
    const fashionUnits = [];
    
    const fashionPieceUnit = new Unit({
      nameAr: "قطعة",
      nameEn: "Piece",
      symbol: "pc",
      descriptionAr: "وحدة قياس",
      descriptionEn: "Measurement unit",
      store: fashionStore._id,
      sortOrder: 1
    });
    await fashionPieceUnit.save();
    fashionUnits.push(fashionPieceUnit);

    const fashionPairUnit = new Unit({
      nameAr: "زوج",
      nameEn: "Pair",
      symbol: "pair",
      descriptionAr: "زوج",
      descriptionEn: "Pair",
      store: fashionStore._id,
      sortOrder: 2
    });
    await fashionPairUnit.save();
    fashionUnits.push(fashionPairUnit);

    //CONSOLE.log('✅ FashionStore units created');

    // Create Categories for TechStore
    //CONSOLE.log('\n📁 Creating categories for TechStore...');
    const techCategories = [];
    
    // Main category
    const techElectronics = new Category({
      nameAr: "إلكترونيات",
      nameEn: "Electronics",
      slug: "electronics-techstore",
      descriptionAr: "كل ما يتعلق بالأجهزة الإلكترونية",
      descriptionEn: "All about electronics",
      store: techStore._id,
      level: 0,
      sortOrder: 1
    });
    await techElectronics.save();
    techCategories.push(techElectronics);

    // Sub-category
    const techSmartphones = new Category({
      nameAr: "هواتف ذكية",
      nameEn: "Smartphones",
      slug: "smartphones-techstore",
      descriptionAr: "جميع أنواع الهواتف الذكية",
      descriptionEn: "All types of smartphones",
      parent: techElectronics._id,
      store: techStore._id,
      level: 1,
      sortOrder: 1
    });
    await techSmartphones.save();
    techCategories.push(techSmartphones);

    // Sub-sub-category
    const techIPhone = new Category({
      nameAr: "آيفون",
      nameEn: "iPhone",
      slug: "iphone-techstore",
      descriptionAr: "هواتف آيفون",
      descriptionEn: "iPhone smartphones",
      parent: techSmartphones._id,
      store: techStore._id,
      level: 2,
      sortOrder: 1
    });
    await techIPhone.save();
    techCategories.push(techIPhone);

    //CONSOLE.log('✅ TechStore categories created');

    // Create Categories for FashionStore
    //CONSOLE.log('\n📁 Creating categories for FashionStore...');
    const fashionCategories = [];
    
    // Main category
    const fashionClothing = new Category({
      nameAr: "ملابس",
      nameEn: "Clothing",
      slug: "clothing-fashionstore",
      descriptionAr: "جميع أنواع الملابس",
      descriptionEn: "All types of clothing",
      store: fashionStore._id,
      level: 0,
      sortOrder: 1
    });
    await fashionClothing.save();
    fashionCategories.push(fashionClothing);

    // Sub-category
    const fashionShirts = new Category({
      nameAr: "قمصان",
      nameEn: "Shirts",
      slug: "shirts-fashionstore",
      descriptionAr: "جميع أنواع القمصان",
      descriptionEn: "All types of shirts",
      parent: fashionClothing._id,
      store: fashionStore._id,
      level: 1,
      sortOrder: 1
    });
    await fashionShirts.save();
    fashionCategories.push(fashionShirts);

    // Sub-sub-category
    const fashionTShirts = new Category({
      nameAr: "تي شيرت",
      nameEn: "T-Shirts",
      slug: "t-shirts-fashionstore",
      descriptionAr: "تي شيرت",
      descriptionEn: "T-Shirts",
      parent: fashionShirts._id,
      store: fashionStore._id,
      level: 2,
      sortOrder: 1
    });
    await fashionTShirts.save();
    fashionCategories.push(fashionTShirts);

    //CONSOLE.log('✅ FashionStore categories created');

    // Create Products for TechStore
    //CONSOLE.log('\n📱 Creating products for TechStore...');
    
    const techProduct1 = new Product({
      nameAr: "آيفون 15 برو",
      nameEn: "iPhone 15 Pro",
      descriptionAr: "هاتف آيفون 15 برو الجديد",
      descriptionEn: "New iPhone 15 Pro smartphone",
      price: 1200,
      compareAtPrice: 1300,
      costPrice: 1000,
      sku: "IPH15PRO-001",
      barcode: "1234567890123",
      category: techIPhone._id,
      categoryPath: [techElectronics._id, techSmartphones._id, techIPhone._id],
      brand: "Apple",
      productLabel: techFeaturedLabel._id,
      unit: techPieceUnit._id,
      availableQuantity: 50,
      stock: 50,
      isActive: true,
      isFeatured: true,
      store: techStore._id
    });
    await techProduct1.save();

    const techProduct2 = new Product({
      nameAr: "سامسونج جالاكسي S24",
      nameEn: "Samsung Galaxy S24",
      descriptionAr: "هاتف سامسونج جالاكسي S24",
      descriptionEn: "Samsung Galaxy S24 smartphone",
      price: 1000,
      compareAtPrice: 1100,
      costPrice: 800,
      sku: "SAMS24-001",
      barcode: "1234567890124",
      category: techSmartphones._id,
      categoryPath: [techElectronics._id, techSmartphones._id],
      brand: "Samsung",
      productLabel: techNewLabel._id,
      unit: techPieceUnit._id,
      availableQuantity: 30,
      stock: 30,
      isActive: true,
      isFeatured: false,
      store: techStore._id
    });
    await techProduct2.save();

    const techProduct3 = new Product({
      nameAr: "شاحن سريع",
      nameEn: "Fast Charger",
      descriptionAr: "شاحن سريع للهواتف",
      descriptionEn: "Fast charger for smartphones",
      price: 25,
      costPrice: 15,
      sku: "CHARGER-001",
      barcode: "1234567890125",
      category: techElectronics._id,
      categoryPath: [techElectronics._id],
      brand: "Generic",
      productLabel: techRegularLabel._id,
      unit: techPieceUnit._id,
      availableQuantity: 100,
      stock: 100,
      isActive: true,
      isFeatured: false,
      store: techStore._id
    });
    await techProduct3.save();

    //CONSOLE.log('✅ TechStore products created');

    // Create Products for FashionStore
    //CONSOLE.log('\n👕 Creating products for FashionStore...');
    
    const fashionProduct1 = new Product({
      nameAr: "قميص قطني",
      nameEn: "Cotton Shirt",
      descriptionAr: "قميص قطني أنيق",
      descriptionEn: "Elegant cotton shirt",
      price: 50,
      compareAtPrice: 60,
      costPrice: 30,
      sku: "SHIRT-001",
      barcode: "1234567890126",
      category: fashionShirts._id,
      categoryPath: [fashionClothing._id, fashionShirts._id],
      brand: "Fashion Brand",
      productLabel: fashionRegularLabel._id,
      unit: fashionPieceUnit._id,
      availableQuantity: 80,
      stock: 80,
      isActive: true,
      isFeatured: false,
      store: fashionStore._id
    });
    await fashionProduct1.save();

    const fashionProduct2 = new Product({
      nameAr: "تي شيرت رياضي",
      nameEn: "Sports T-Shirt",
      descriptionAr: "تي شيرت رياضي مريح",
      descriptionEn: "Comfortable sports t-shirt",
      price: 30,
      compareAtPrice: 40,
      costPrice: 20,
      sku: "TSHIRT-001",
      barcode: "1234567890127",
      category: fashionTShirts._id,
      categoryPath: [fashionClothing._id, fashionShirts._id, fashionTShirts._id],
      brand: "Sports Brand",
      productLabel: fashionSaleLabel._id,
      unit: fashionPieceUnit._id,
      availableQuantity: 120,
      stock: 120,
      isActive: true,
      isFeatured: true,
      store: fashionStore._id
    });
    await fashionProduct2.save();

    const fashionProduct3 = new Product({
      nameAr: "جينز كلاسيك",
      nameEn: "Classic Jeans",
      descriptionAr: "جينز كلاسيك أنيق",
      descriptionEn: "Elegant classic jeans",
      price: 80,
      compareAtPrice: 100,
      costPrice: 50,
      sku: "JEANS-001",
      barcode: "1234567890128",
      category: fashionClothing._id,
      categoryPath: [fashionClothing._id],
      brand: "Denim Brand",
      productLabel: fashionTrendyLabel._id,
      unit: fashionPieceUnit._id,
      availableQuantity: 60,
      stock: 60,
      isActive: true,
      isFeatured: true,
      store: fashionStore._id
    });
    await fashionProduct3.save();

    //CONSOLE.log('✅ FashionStore products created');

    // Summary
    //CONSOLE.log('\n🎉 Test data creation completed successfully!');
    //CONSOLE.log('\n📊 Summary:');
    //CONSOLE.log('🏪 Stores: 2');
    //CONSOLE.log('👥 Users: 6 (3 per store)');
    //CONSOLE.log('👑 Owners: 6 (3 per store)');
    //CONSOLE.log('🏷️ Product Labels: 6 (3 per store)');
    //CONSOLE.log('📦 Units: 4 (2 per store)');
    //CONSOLE.log('📁 Categories: 6 (3 per store)');
    //CONSOLE.log('📱 Products: 6 (3 per store)');
    
    //CONSOLE.log('\n🔑 Test Credentials:');
    //CONSOLE.log('TechStore Owner: ahmed.tech@test.com / password123');
    //CONSOLE.log('TechStore Admin: sara.tech@test.com / password123');
    //CONSOLE.log('TechStore Staff: omar.tech@test.com / password123');
    //CONSOLE.log('FashionStore Owner: fatima.fashion@test.com / password123');
    //CONSOLE.log('FashionStore Admin: layla.fashion@test.com / password123');
    //CONSOLE.log('FashionStore Staff: youssef.fashion@test.com / password123');
    
    //CONSOLE.log('\n🆔 Store IDs:');
    //CONSOLE.log('TechStore:', techStore._id);
    //CONSOLE.log('FashionStore:', fashionStore._id);

  } catch (error) {
    //CONSOLE.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createTestData(); 