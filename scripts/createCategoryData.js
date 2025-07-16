const mongoose = require('mongoose');
const Category = require('../Models/Category');
const Store = require('../Models/Store');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');
  } catch (error) {
    //CONSOLE.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample category data for different stores
const categoryData = {
  electronics: {
    nameAr: 'إلكترونيات',
    nameEn: 'Electronics',
    descriptionAr: 'كل ما يتعلق بالأجهزة الإلكترونية والهواتف الذكية',
    descriptionEn: 'All electronics and smartphones',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    icon: '📱'
  },
  clothing: {
    nameAr: 'ملابس',
    nameEn: 'Clothing',
    descriptionAr: 'ملابس رجالية ونسائية وأطفال',
    descriptionEn: 'Men, women and children clothing',
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    icon: '👕'
  },
  shoes: {
    nameAr: 'أحذية',
    nameEn: 'Shoes',
    descriptionAr: 'أحذية رياضية وعادية',
    descriptionEn: 'Sports and casual shoes',
    isActive: true,
    isFeatured: false,
    sortOrder: 3,
    icon: '👟'
  },
  books: {
    nameAr: 'كتب',
    nameEn: 'Books',
    descriptionAr: 'كتب تعليمية وروايات',
    descriptionEn: 'Educational books and novels',
    isActive: true,
    isFeatured: false,
    sortOrder: 4,
    icon: '📚'
  },
  home: {
    nameAr: 'منزل',
    nameEn: 'Home & Garden',
    descriptionAr: 'مستلزمات المنزل والحديقة',
    descriptionEn: 'Home and garden supplies',
    isActive: true,
    isFeatured: true,
    sortOrder: 5,
    icon: '🏠'
  }
};

// Subcategories data
const subcategoryData = {
  smartphones: {
    nameAr: 'هواتف ذكية',
    nameEn: 'Smartphones',
    descriptionAr: 'هواتف ذكية حديثة',
    descriptionEn: 'Modern smartphones',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    icon: '📱'
  },
  laptops: {
    nameAr: 'حواسيب محمولة',
    nameEn: 'Laptops',
    descriptionAr: 'حواسيب محمولة وأجهزة لوحية',
    descriptionEn: 'Laptops and tablets',
    isActive: true,
    isFeatured: false,
    sortOrder: 2,
    icon: '💻'
  },
  mensClothing: {
    nameAr: 'ملابس رجالية',
    nameEn: 'Men\'s Clothing',
    descriptionAr: 'ملابس للرجال',
    descriptionEn: 'Clothing for men',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    icon: '👨'
  },
  womensClothing: {
    nameAr: 'ملابس نسائية',
    nameEn: 'Women\'s Clothing',
    descriptionAr: 'ملابس للنساء',
    descriptionEn: 'Clothing for women',
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    icon: '👩'
  }
};

async function createCategoriesForStore(storeId, storeName) {
  //CONSOLE.log(`\n🏪 Creating categories for store: ${storeName}`);
  
  const createdCategories = {};
  
  // Create main categories
  for (const [key, categoryInfo] of Object.entries(categoryData)) {
    const category = new Category({
      ...categoryInfo,
      store: storeId,
      slug: categoryInfo.nameEn.toLowerCase().replace(/\s+/g, '-')
    });
    
    await category.save();
    createdCategories[key] = category;
    //CONSOLE.log(`✅ Created category: ${category.nameEn}`);
  }
  
  // Create subcategories for electronics
  if (createdCategories.electronics) {
    const smartphoneCategory = new Category({
      ...subcategoryData.smartphones,
      store: storeId,
      parent: createdCategories.electronics._id,
      level: 1,
      slug: subcategoryData.smartphones.nameEn.toLowerCase().replace(/\s+/g, '-')
    });
    await smartphoneCategory.save();
    //CONSOLE.log(`✅ Created subcategory: ${smartphoneCategory.nameEn} under Electronics`);
    
    const laptopCategory = new Category({
      ...subcategoryData.laptops,
      store: storeId,
      parent: createdCategories.electronics._id,
      level: 1,
      slug: subcategoryData.laptops.nameEn.toLowerCase().replace(/\s+/g, '-')
    });
    await laptopCategory.save();
    //CONSOLE.log(`✅ Created subcategory: ${laptopCategory.nameEn} under Electronics`);
  }
  
  // Create subcategories for clothing
  if (createdCategories.clothing) {
    const mensCategory = new Category({
      ...subcategoryData.mensClothing,
      store: storeId,
      parent: createdCategories.clothing._id,
      level: 1,
      slug: subcategoryData.mensClothing.nameEn.toLowerCase().replace(/\s+/g, '-')
    });
    await mensCategory.save();
    //CONSOLE.log(`✅ Created subcategory: ${mensCategory.nameEn} under Clothing`);
    
    const womensCategory = new Category({
      ...subcategoryData.womensClothing,
      store: storeId,
      parent: createdCategories.clothing._id,
      level: 1,
      slug: subcategoryData.womensClothing.nameEn.toLowerCase().replace(/\s+/g, '-')
    });
    await womensCategory.save();
    //CONSOLE.log(`✅ Created subcategory: ${womensCategory.nameEn} under Clothing`);
  }
  
  return createdCategories;
}

async function createTestData() {
  try {
    await connectDB();
    
    //CONSOLE.log('🚀 Starting to create category test data...\n');
    
    // Get or create test stores
    let store1 = await Store.findOne({ domain: 'test-store-1' });
    if (!store1) {
      store1 = new Store({
        name: 'Test Store 1',
        description: 'First test store for category testing',
        domain: 'test-store-1',
        status: 'active',
        contact: {
          email: 'test1@example.com'
        }
      });
      await store1.save();
      //CONSOLE.log('✅ Created test store 1');
    }
    
    let store2 = await Store.findOne({ domain: 'test-store-2' });
    if (!store2) {
      store2 = new Store({
        name: 'Test Store 2',
        description: 'Second test store for category testing',
        domain: 'test-store-2',
        status: 'active',
        contact: {
          email: 'test2@example.com'
        }
      });
      await store2.save();
      //CONSOLE.log('✅ Created test store 2');
    }
    
    // Clear existing categories for these stores
    await Category.deleteMany({ store: { $in: [store1._id, store2._id] } });
    //CONSOLE.log('🧹 Cleared existing categories for test stores');
    
    // Create categories for store 1
    await createCategoriesForStore(store1._id, store1.name);
    
    // Create categories for store 2 (different set)
    await createCategoriesForStore(store2._id, store2.name);
    
    //CONSOLE.log('\n🎉 Category test data created successfully!');
    //CONSOLE.log('\n📊 Summary:');
    //CONSOLE.log(`Store 1 (${store1.name}): ${store1._id}`);
    //CONSOLE.log(`Store 2 (${store2.name}): ${store2._id}`);
    //CONSOLE.log('\nYou can now test the API with these store IDs');
    
    // Count categories for each store
    const store1Count = await Category.countDocuments({ store: store1._id });
    const store2Count = await Category.countDocuments({ store: store2._id });
    
    //CONSOLE.log(`\n📈 Categories created:`);
    //CONSOLE.log(`Store 1: ${store1Count} categories`);
    //CONSOLE.log(`Store 2: ${store2Count} categories`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData }; 