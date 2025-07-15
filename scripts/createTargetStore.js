const mongoose = require('mongoose');

// Store ID المطلوب
const TARGET_STORE_ID = '687505893fbf3098648bfe16';

async function createTargetStore() {
  try {
    console.log('🔄 Creating target store...');
    console.log(`📝 Target Store ID: ${TARGET_STORE_ID}`);
    
    const Store = require('../Models/Store');
    
    // التحقق من وجود المتجر
    const existingStore = await Store.findById(TARGET_STORE_ID);
    
    if (existingStore) {
      console.log(`✅ Store already exists: ${existingStore.nameAr} (${existingStore.nameEn})`);
      return existingStore;
    }
    
    // إنشاء المتجر الجديد
    const newStore = new Store({
      _id: TARGET_STORE_ID,
      nameAr: 'متجري الرئيسي',
      nameEn: 'My Main Store',
      descriptionAr: 'المتجر الرئيسي للتطبيق',
      descriptionEn: 'Main store for the application',
      slug: 'my-main-store',
      status: 'active',
      settings: {
        mainColor: '#000000',
        language: 'ar',
        storeDiscount: 0,
        timezone: 'Asia/Amman',
        taxRate: 0,
        shippingEnabled: true,
        storeSocials: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          linkedin: '',
          telegram: '',
          snapchat: '',
          pinterest: '',
          tiktok: ''
        }
      },
      whatsappNumber: '+962700000000',
      contact: {
        email: 'info@mystore.com',
        phone: '+962700000000',
        address: {
          street: 'شارع الملك حسين',
          city: 'عمان',
          state: 'عمان',
          zipCode: '11181',
          country: 'الأردن'
        }
      }
    });
    
    await newStore.save();
    console.log(`✅ Created new store: ${newStore.nameAr} (${newStore.nameEn})`);
    
    return newStore;
    
  } catch (error) {
    console.error('❌ Error creating target store:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('🔗 Connected to MongoDB');
      createTargetStore();
    })
    .catch(err => {
      console.error('❌ Database connection error:', err);
      process.exit(1);
    });
}

module.exports = createTargetStore; 