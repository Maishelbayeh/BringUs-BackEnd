const mongoose = require('mongoose');
const ProductSpecification = require('../Models/ProductSpecification');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
const STORE_ID = '687505893fbf3098648bfe16'; // Store ID المحدد

async function addProductSpecsToStore() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');
    //CONSOLE.log(`🏪 Adding data to Store ID: ${STORE_ID}`);

    // البيانات المطلوبة إضافتها - الآن مع الهيكل الصحيح
    const specsToAdd = [
      {
        titleAr: 'الطول',
        titleEn: 'Length',
        values: [
          { valueAr: 'طويل', valueEn: 'Long' },
          { valueAr: 'قصير', valueEn: 'Short' }
        ],
        sortOrder: 1
      },
      {
        titleAr: 'الحجم',
        titleEn: 'Size',
        values: [
          { valueAr: 'كبير', valueEn: 'Large' },
          { valueAr: 'وسط', valueEn: 'Medium' },
          { valueAr: 'صغير', valueEn: 'Small' }
        ],
        sortOrder: 2
      },
      {
        titleAr: 'مقاس الحذاء',
        titleEn: 'Shoe Size',
        values: [
          { valueAr: 'نمرة 40', valueEn: 'Size 40' },
          { valueAr: 'نمرة 42', valueEn: 'Size 42' },
          { valueAr: 'نمرة 44', valueEn: 'Size 44' }
        ],
        sortOrder: 3
      },
      {
        titleAr: 'العرض',
        titleEn: 'Width',
        values: [
          { valueAr: 'عريض', valueEn: 'Wide' },
          { valueAr: 'ضيق', valueEn: 'Narrow' }
        ],
        sortOrder: 4
      },
      {
        titleAr: 'اللون',
        titleEn: 'Color',
        values: [
          { valueAr: 'أحمر', valueEn: 'Red' },
          { valueAr: 'أزرق', valueEn: 'Blue' },
          { valueAr: 'أخضر', valueEn: 'Green' },
          { valueAr: 'أسود', valueEn: 'Black' },
          { valueAr: 'أبيض', valueEn: 'White' }
        ],
        sortOrder: 5
      },
      {
        titleAr: 'المادة',
        titleEn: 'Material',
        values: [
          { valueAr: 'قطن', valueEn: 'Cotton' },
          { valueAr: 'صوف', valueEn: 'Wool' },
          { valueAr: 'جلد', valueEn: 'Leather' },
          { valueAr: 'بلاستيك', valueEn: 'Plastic' }
        ],
        sortOrder: 6
      }
    ];

    // إضافة البيانات إلى قاعدة البيانات
    const createdSpecs = [];
    
    for (const spec of specsToAdd) {
      const newSpec = new ProductSpecification({
        ...spec,
        store: STORE_ID,
        category: null, // بدون تصنيف
        isActive: true
      });
      
      await newSpec.save();
      createdSpecs.push(newSpec);
      //CONSOLE.log(`✅ Added: ${spec.titleAr} / ${spec.titleEn} with ${spec.values.length} values`);
    }

    //CONSOLE.log(`\n🎉 Successfully added ${createdSpecs.length} specifications to store ${STORE_ID}`);
    
    // عرض إجمالي المواصفات في المتجر
    const totalSpecs = await ProductSpecification.countDocuments({ store: STORE_ID });
    //CONSOLE.log(`📊 Total specifications in store ${STORE_ID}: ${totalSpecs}`);

  } catch (error) {
    //CONSOLE.error('❌ Error adding specifications:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('🔌 Disconnected from MongoDB');
  }
}

// تشغيل السكريبت
addProductSpecsToStore(); 