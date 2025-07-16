const mongoose = require('mongoose');
const ProductSpecification = require('../Models/ProductSpecification');
const Category = require('../Models/Category');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
const STORE_ID = '687505893fbf3098648bfe16'; // Store ID المحدد

async function createProductSpecificationsData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');
    //CONSOLE.log(`🏪 Using Store ID: ${STORE_ID}`);

    // Get a category to use for specifications
    const category = await Category.findOne({ store: STORE_ID });
    if (!category) {
      //CONSOLE.log('❌ No category found for store. Please create a category first.');
      //CONSOLE.log('💡 You can create a category first or the script will create specifications without category association.');
      
      // Continue without category if none exists
      //CONSOLE.log('🔄 Continuing without category association...');
    } else {
      //CONSOLE.log(`📁 Using category: ${category.nameEn} (${category._id})`);
    }

    // Sample product specifications data based on initialProductSpecifications
    const specificationsData = [
      {
        descriptionAr: 'طويل',
        descriptionEn: 'Long',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 1
      },
      {
        descriptionAr: 'قصير',
        descriptionEn: 'Short',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 2
      },
      {
        descriptionAr: 'كبير',
        descriptionEn: 'Large',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 3
      },
      {
        descriptionAr: 'وسط',
        descriptionEn: 'Medium',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 4
      },
      {
        descriptionAr: 'صغير',
        descriptionEn: 'Small',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 5
      },
      {
        descriptionAr: 'نمرة 40',
        descriptionEn: 'Size 40',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 6
      },
      {
        descriptionAr: 'نمرة 42',
        descriptionEn: 'Size 42',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 7
      },
      {
        descriptionAr: 'نمرة 44',
        descriptionEn: 'Size 44',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 8
      },
      {
        descriptionAr: 'عريض',
        descriptionEn: 'Wide',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 9
      },
      {
        descriptionAr: 'ضيق',
        descriptionEn: 'Narrow',
        category: category?._id || null,
        store: STORE_ID,
        sortOrder: 10
      }
    ];

    // Clear existing specifications for this store
    const deleteResult = await ProductSpecification.deleteMany({ store: STORE_ID });
    //CONSOLE.log(`🗑️ Cleared ${deleteResult.deletedCount} existing specifications for store ${STORE_ID}`);

    // Insert new specifications
    const specifications = await ProductSpecification.insertMany(specificationsData);
    //CONSOLE.log(`✅ Created ${specifications.length} product specifications for store ${STORE_ID}`);

    // Display created specifications
    //CONSOLE.log('\n📋 Created Specifications:');
    specifications.forEach((spec, index) => {
      //CONSOLE.log(`${index + 1}. ${spec.descriptionAr} / ${spec.descriptionEn} (Order: ${spec.sortOrder})`);
    });

    //CONSOLE.log('\n🎉 Product Specifications data created successfully!');
    //CONSOLE.log(`📊 Total specifications in database for store ${STORE_ID}: ${specifications.length}`);

    // Test the API endpoint
    //CONSOLE.log('\n🧪 Testing API endpoint...');
    const testSpecs = await ProductSpecification.find({ store: STORE_ID }).populate('category');
    //CONSOLE.log(`✅ API test successful - Found ${testSpecs.length} specifications`);

  } catch (error) {
    //CONSOLE.error('❌ Error creating product specifications data:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createProductSpecificationsData(); 