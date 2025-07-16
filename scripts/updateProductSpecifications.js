const mongoose = require('mongoose');
const ProductSpecification = require('../Models/ProductSpecification');
const Category = require('../Models/Category');

// بيانات المواصفات الجديدة بناءً على البنية الجديدة
const newSpecifications = [
  {
    titleAr: 'الحجم',
    titleEn: 'Size',
    values: [
      { valueAr: 'صغير', valueEn: 'Small' },
      { valueAr: 'وسط', valueEn: 'Medium' },
      { valueAr: 'كبير', valueEn: 'Large' },
      { valueAr: 'كبير جداً', valueEn: 'Extra Large' }
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    titleAr: 'اللون',
    titleEn: 'Color',
    values: [
      { valueAr: 'أحمر', valueEn: 'Red' },
      { valueAr: 'أزرق', valueEn: 'Blue' },
      { valueAr: 'أخضر', valueEn: 'Green' },
      { valueAr: 'أصفر', valueEn: 'Yellow' },
      { valueAr: 'أسود', valueEn: 'Black' },
      { valueAr: 'أبيض', valueEn: 'White' },
      { valueAr: 'رمادي', valueEn: 'Gray' },
      { valueAr: 'بني', valueEn: 'Brown' }
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    titleAr: 'المادة',
    titleEn: 'Material',
    values: [
      { valueAr: 'قطن', valueEn: 'Cotton' },
      { valueAr: 'بوليستر', valueEn: 'Polyester' },
      { valueAr: 'صوف', valueEn: 'Wool' },
      { valueAr: 'حرير', valueEn: 'Silk' },
      { valueAr: 'جلد', valueEn: 'Leather' },
      { valueAr: 'بلاستيك', valueEn: 'Plastic' },
      { valueAr: 'خشب', valueEn: 'Wood' },
      { valueAr: 'معدن', valueEn: 'Metal' }
    ],
    sortOrder: 3,
    isActive: true
  },
  {
    titleAr: 'النمط',
    titleEn: 'Style',
    values: [
      { valueAr: 'كلاسيكي', valueEn: 'Classic' },
      { valueAr: 'عصري', valueEn: 'Modern' },
      { valueAr: 'رياضي', valueEn: 'Sporty' },
      { valueAr: 'أنيق', valueEn: 'Elegant' },
      { valueAr: 'كاجوال', valueEn: 'Casual' },
      { valueAr: 'رسمي', valueEn: 'Formal' }
    ],
    sortOrder: 4,
    isActive: true
  },
  {
    titleAr: 'الوزن',
    titleEn: 'Weight',
    values: [
      { valueAr: 'خفيف', valueEn: 'Light' },
      { valueAr: 'متوسط', valueEn: 'Medium' },
      { valueAr: 'ثقيل', valueEn: 'Heavy' }
    ],
    sortOrder: 5,
    isActive: true
  },
  {
    titleAr: 'الطول',
    titleEn: 'Length',
    values: [
      { valueAr: 'قصير', valueEn: 'Short' },
      { valueAr: 'متوسط', valueEn: 'Medium' },
      { valueAr: 'طويل', valueEn: 'Long' }
    ],
    sortOrder: 6,
    isActive: true
  },
  {
    titleAr: 'العرض',
    titleEn: 'Width',
    values: [
      { valueAr: 'ضيق', valueEn: 'Narrow' },
      { valueAr: 'عادي', valueEn: 'Regular' },
      { valueAr: 'عريض', valueEn: 'Wide' }
    ],
    sortOrder: 7,
    isActive: true
  },
  {
    titleAr: 'الضمان',
    titleEn: 'Warranty',
    values: [
      { valueAr: 'لا يوجد ضمان', valueEn: 'No Warranty' },
      { valueAr: 'ضمان سنة واحدة', valueEn: '1 Year Warranty' },
      { valueAr: 'ضمان سنتين', valueEn: '2 Years Warranty' },
      { valueAr: 'ضمان 3 سنوات', valueEn: '3 Years Warranty' },
      { valueAr: 'ضمان مدى الحياة', valueEn: 'Lifetime Warranty' }
    ],
    sortOrder: 8,
    isActive: true
  },
  {
    titleAr: 'العلامة التجارية',
    titleEn: 'Brand',
    values: [
      { valueAr: 'نايك', valueEn: 'Nike' },
      { valueAr: 'أديداس', valueEn: 'Adidas' },
      { valueAr: 'بوما', valueEn: 'Puma' },
      { valueAr: 'أندر آرمور', valueEn: 'Under Armour' },
      { valueAr: 'نيو بالانس', valueEn: 'New Balance' },
      { valueAr: 'كونفيرس', valueEn: 'Converse' },
      { valueAr: 'فانس', valueEn: 'Vans' },
      { valueAr: 'سكيتشرز', valueEn: 'Skechers' }
    ],
    sortOrder: 9,
    isActive: true
  },
  {
    titleAr: 'نوع المنتج',
    titleEn: 'Product Type',
    values: [
      { valueAr: 'ملابس', valueEn: 'Clothing' },
      { valueAr: 'أحذية', valueEn: 'Shoes' },
      { valueAr: 'إكسسوارات', valueEn: 'Accessories' },
      { valueAr: 'أجهزة إلكترونية', valueEn: 'Electronics' },
      { valueAr: 'أثاث', valueEn: 'Furniture' },
      { valueAr: 'أدوات منزلية', valueEn: 'Home Appliances' },
      { valueAr: 'كتب', valueEn: 'Books' },
      { valueAr: 'ألعاب', valueEn: 'Toys' }
    ],
    sortOrder: 10,
    isActive: true
  }
];

async function updateProductSpecifications() {
  try {
    //CONSOLE.log('🔄 Starting ProductSpecification update process...');
    
    // حذف جميع البيانات الحالية
    //CONSOLE.log('🗑️ Deleting existing specifications...');
    await ProductSpecification.deleteMany({});
    //CONSOLE.log('✅ All existing specifications deleted');
    
    // الحصول على جميع المتاجر من قاعدة البيانات
    const Store = require('../Models/Store');
    const stores = await Store.find({});
    
    if (stores.length === 0) {
      //CONSOLE.log('⚠️ No stores found. Please create stores first.');
      return;
    }
    
    //CONSOLE.log(`📊 Found ${stores.length} stores`);
    
    // إضافة المواصفات الجديدة لكل متجر
    let totalCreated = 0;
    
    for (const store of stores) {
      //CONSOLE.log(`🏪 Creating specifications for store: ${store.name} (${store._id})`);
      
      for (const spec of newSpecifications) {
        const newSpec = new ProductSpecification({
          ...spec,
          store: store._id
        });
        
        await newSpec.save();
        totalCreated++;
      }
      
      //CONSOLE.log(`✅ Created ${newSpecifications.length} specifications for store: ${store.name}`);
    }
    
    //CONSOLE.log(`🎉 Successfully created ${totalCreated} specifications across ${stores.length} stores`);
    
    // عرض إحصائيات
    const totalSpecs = await ProductSpecification.countDocuments();
    //CONSOLE.log(`📈 Total specifications in database: ${totalSpecs}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error updating product specifications:', error);
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('🔌 Database connection closed');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  // الاتصال بقاعدة البيانات - استخدام نفس الرابط من server.js
  const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      //CONSOLE.log('🔗 Connected to MongoDB');
      updateProductSpecifications();
    })
    .catch(err => {
      //CONSOLE.error('❌ Database connection error:', err);
      process.exit(1);
    });
}

module.exports = updateProductSpecifications; 