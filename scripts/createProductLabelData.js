const mongoose = require('mongoose');
const ProductLabel = require('../Models/ProductLabel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

const storeId = '687505893fbf3098648bfe16';

const productLabels = [
  {
    nameAr: 'عادي',
    nameEn: 'Regular',
    descriptionAr: 'المنتجات العادية',
    descriptionEn: 'Regular products',
    isActive: true,
    sortOrder: 1,
    store: storeId
  },
  {
    nameAr: 'عرض خاص',
    nameEn: 'Special Offer',
    descriptionAr: 'المنتجات المعروضة بأسعار خاصة',
    descriptionEn: 'Products with special pricing',
    isActive: true,
    sortOrder: 2,
    store: storeId
  },
  {
    nameAr: 'مميز',
    nameEn: 'Featured',
    descriptionAr: 'المنتجات المميزة',
    descriptionEn: 'Featured products',
    isActive: true,
    sortOrder: 3,
    store: storeId
  },
  {
    nameAr: 'جديد',
    nameEn: 'New',
    descriptionAr: 'المنتجات الجديدة',
    descriptionEn: 'New products',
    isActive: true,
    sortOrder: 4,
    store: storeId
  },
  {
    nameAr: 'الأكثر مبيعاً',
    nameEn: 'Best Seller',
    descriptionAr: 'المنتجات الأكثر مبيعاً',
    descriptionEn: 'Best selling products',
    isActive: true,
    sortOrder: 5,
    store: storeId
  },
  {
    nameAr: 'تخفيض',
    nameEn: 'Sale',
    descriptionAr: 'المنتجات المخفضة',
    descriptionEn: 'Products on sale',
    isActive: true,
    sortOrder: 6,
    store: storeId
  },
  {
    nameAr: 'محدود',
    nameEn: 'Limited',
    descriptionAr: 'المنتجات محدودة الكمية',
    descriptionEn: 'Limited quantity products',
    isActive: true,
    sortOrder: 7,
    store: storeId
  },
  {
    nameAr: 'حصري',
    nameEn: 'Exclusive',
    descriptionAr: 'المنتجات الحصرية',
    descriptionEn: 'Exclusive products',
    isActive: true,
    sortOrder: 8,
    store: storeId
  }
];

async function createProductLabelData() {
  try {
    console.log('Starting to create product label data...');
    
    // Clear existing product labels for this store
    await ProductLabel.deleteMany({ store: storeId });
    console.log(`Cleared existing product labels for store: ${storeId}`);
    
    // Insert new product labels
    const createdLabels = await ProductLabel.insertMany(productLabels);
    console.log(`Successfully created ${createdLabels.length} product labels for store: ${storeId}`);
    
    // Display created labels
    createdLabels.forEach((label, index) => {
      console.log(`${index + 1}. ${label.nameEn} (${label.nameAr}) - ${label.descriptionEn}`);
    });
    
    console.log('\nProduct label data creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating product label data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
createProductLabelData(); 