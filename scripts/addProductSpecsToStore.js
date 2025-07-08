const mongoose = require('mongoose');
const ProductSpecification = require('../Models/ProductSpecification');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
const STORE_ID = '686a719956a82bfcc93a2e2d'; // Store ID المحدد

async function addProductSpecsToStore() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`🏪 Adding data to Store ID: ${STORE_ID}`);

    // البيانات المطلوبة إضافتها
    const specsToAdd = [
      { descriptionAr: 'طويل', descriptionEn: 'Long', sortOrder: 1 },
      { descriptionAr: 'قصير', descriptionEn: 'Short', sortOrder: 2 },
      { descriptionAr: 'كبير', descriptionEn: 'Large', sortOrder: 3 },
      { descriptionAr: 'وسط', descriptionEn: 'Medium', sortOrder: 4 },
      { descriptionAr: 'صغير', descriptionEn: 'Small', sortOrder: 5 },
      { descriptionAr: 'نمرة 40', descriptionEn: 'Size 40', sortOrder: 6 },
      { descriptionAr: 'نمرة 42', descriptionEn: 'Size 42', sortOrder: 7 },
      { descriptionAr: 'نمرة 44', descriptionEn: 'Size 44', sortOrder: 8 },
      { descriptionAr: 'عريض', descriptionEn: 'Wide', sortOrder: 9 },
      { descriptionAr: 'ضيق', descriptionEn: 'Narrow', sortOrder: 10 }
    ];

    // إضافة البيانات إلى قاعدة البيانات
    const createdSpecs = [];
    
    for (const spec of specsToAdd) {
      const newSpec = new ProductSpecification({
        ...spec,
        store: STORE_ID,
        category: null // بدون تصنيف
      });
      
      await newSpec.save();
      createdSpecs.push(newSpec);
      console.log(`✅ Added: ${spec.descriptionAr} / ${spec.descriptionEn}`);
    }

    console.log(`\n🎉 Successfully added ${createdSpecs.length} specifications to store ${STORE_ID}`);
    
    // عرض إجمالي المواصفات في المتجر
    const totalSpecs = await ProductSpecification.countDocuments({ store: STORE_ID });
    console.log(`📊 Total specifications in store ${STORE_ID}: ${totalSpecs}`);

  } catch (error) {
    console.error('❌ Error adding specifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// تشغيل السكريبت
addProductSpecsToStore(); 