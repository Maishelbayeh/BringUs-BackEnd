const mongoose = require('mongoose');
const ProductSpecification = require('../Models/ProductSpecification');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

const createSampleProductSpecifications = async () => {
  try {
    console.log('🚀 Creating sample product specifications...\n');

    // Clear existing specifications for this store
    await ProductSpecification.deleteMany({ store: storeId });
    console.log('✅ Cleared existing product specifications for store');

    // Create sample product specifications
    const sampleSpecifications = [
      {
        descriptionAr: 'طويل',
        descriptionEn: 'Long',
        store: storeId,
        sortOrder: 1,
        isActive: true
      },
      {
        descriptionAr: 'قصير',
        descriptionEn: 'Short',
        store: storeId,
        sortOrder: 2,
        isActive: true
      },
      {
        descriptionAr: 'كبير',
        descriptionEn: 'Large',
        store: storeId,
        sortOrder: 3,
        isActive: true
      },
      {
        descriptionAr: 'وسط',
        descriptionEn: 'Medium',
        store: storeId,
        sortOrder: 4,
        isActive: true
      },
      {
        descriptionAr: 'صغير',
        descriptionEn: 'Small',
        store: storeId,
        sortOrder: 5,
        isActive: true
      },
      {
        descriptionAr: 'نمرة 40',
        descriptionEn: 'Size 40',
        store: storeId,
        sortOrder: 6,
        isActive: true
      },
      {
        descriptionAr: 'نمرة 42',
        descriptionEn: 'Size 42',
        store: storeId,
        sortOrder: 7,
        isActive: true
      },
      {
        descriptionAr: 'نمرة 44',
        descriptionEn: 'Size 44',
        store: storeId,
        sortOrder: 8,
        isActive: true
      },
      {
        descriptionAr: 'عريض',
        descriptionEn: 'Wide',
        store: storeId,
        sortOrder: 9,
        isActive: true
      },
      {
        descriptionAr: 'ضيق',
        descriptionEn: 'Narrow',
        store: storeId,
        sortOrder: 10,
        isActive: true
      }
    ];

    const createdSpecifications = await ProductSpecification.insertMany(sampleSpecifications);
    console.log(`✅ Created ${createdSpecifications.length} product specifications:`);
    
    createdSpecifications.forEach(spec => {
      console.log(`  - ${spec.descriptionEn} (${spec.descriptionAr}) - ID: ${spec._id}`);
    });

    console.log('\n🎉 Sample product specifications created successfully!');

  } catch (error) {
    console.error('❌ Error creating product specifications:', error);
  } finally {
    mongoose.connection.close();
  }
};

createSampleProductSpecifications(); 