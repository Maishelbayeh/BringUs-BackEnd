const mongoose = require('mongoose');
const ProductLabel = require('../Models/ProductLabel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bringus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

const createSampleProductLabels = async () => {
  try {
    console.log('🚀 Creating sample product labels...\n');

    // Clear existing labels for this store
    await ProductLabel.deleteMany({ store: storeId });
    console.log('✅ Cleared existing product labels for store');

    // Create sample product labels
    const sampleLabels = [
      {
        nameAr: 'عادي',
        nameEn: 'Regular',
        descriptionAr: 'منتجات عادية',
        descriptionEn: 'Regular products',
        color: '#6B7280',
        sortOrder: 1,
        store: storeId,
        isActive: true
      },
      {
        nameAr: 'مميز',
        nameEn: 'Featured',
        descriptionAr: 'منتجات مميزة',
        descriptionEn: 'Featured products',
        color: '#F59E0B',
        sortOrder: 2,
        store: storeId,
        isActive: true
      },
      {
        nameAr: 'جديد',
        nameEn: 'New',
        descriptionAr: 'منتجات جديدة',
        descriptionEn: 'New products',
        color: '#10B981',
        sortOrder: 3,
        store: storeId,
        isActive: true
      },
      {
        nameAr: 'تخفيض',
        nameEn: 'Sale',
        descriptionAr: 'منتجات مخفضة',
        descriptionEn: 'Sale products',
        color: '#EF4444',
        sortOrder: 4,
        store: storeId,
        isActive: true
      },
      {
        nameAr: 'الأكثر مبيعاً',
        nameEn: 'Best Seller',
        descriptionAr: 'الأكثر مبيعاً',
        descriptionEn: 'Best selling products',
        color: '#8B5CF6',
        sortOrder: 5,
        store: storeId,
        isActive: true
      }
    ];

    const createdLabels = await ProductLabel.insertMany(sampleLabels);
    console.log(`✅ Created ${createdLabels.length} product labels:`);
    
    createdLabels.forEach(label => {
      console.log(`  - ${label.nameEn} (${label.nameAr}) - Color: ${label.color} - ID: ${label._id}`);
    });

    console.log('\n🎉 Sample product labels created successfully!');

  } catch (error) {
    console.error('❌ Error creating product labels:', error);
  } finally {
    mongoose.connection.close();
  }
};

createSampleProductLabels(); 