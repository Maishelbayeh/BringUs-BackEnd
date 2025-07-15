const mongoose = require('mongoose');
const Store = require('./Models/Store');

const STORE_ID = '687505893fbf3098648bfe16';

async function checkStore() {
  try {
    console.log('🔍 Checking if store exists...');
    console.log(`📝 Store ID: ${STORE_ID}`);
    
    const store = await Store.findById(STORE_ID);
    
    if (store) {
      console.log('✅ Store found!');
      console.log('📊 Store details:');
      console.log(`   Name (Ar): ${store.nameAr}`);
      console.log(`   Name (En): ${store.nameEn}`);
      console.log(`   Status: ${store.status}`);
      console.log(`   Slug: ${store.slug}`);
    } else {
      console.log('❌ Store not found!');
      console.log('💡 Creating the store...');
      
      const newStore = new Store({
        _id: STORE_ID,
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
      console.log('✅ Store created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Connect to database and run
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🔗 Connected to MongoDB');
    checkStore();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }); 