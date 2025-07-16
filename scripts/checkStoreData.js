const mongoose = require('mongoose');

async function checkStoreData() {
  try {
    //CONSOLE.log('🔍 Checking store data...');
    
    // التحقق من المتاجر الموجودة
    const Store = require('../Models/Store');
    const stores = await Store.find({});
    
    //CONSOLE.log('\n📊 Stores found:');
    stores.forEach(store => {
      //CONSOLE.log(`- ${store.nameAr} (${store.nameEn}): ${store._id}`);
    });
    
    // التحقق من البيانات المرتبطة بكل متجر
    const ProductSpecification = require('../Models/ProductSpecification');
    const Product = require('../Models/Product');
    const Category = require('../Models/Category');
    const Unit = require('../Models/Unit');
    const ProductLabel = require('../Models/ProductLabel');
    const DeliveryMethod = require('../Models/DeliveryMethod');
    const PaymentMethod = require('../Models/PaymentMethod');
    const Advertisement = require('../Models/Advertisement');
    const StoreSlider = require('../Models/StoreSlider');
    const TermsConditions = require('../Models/TermsConditions');
    const Wholesaler = require('../Models/Wholesaler');
    const Affiliation = require('../Models/Affiliation');
    const AffiliatePayment = require('../Models/AffiliatePayment');
    
    for (const store of stores) {
      //CONSOLE.log(`\n🏪 Store: ${store.nameAr} (${store._id})`);
      
      const specs = await ProductSpecification.countDocuments({ store: store._id });
      const products = await Product.countDocuments({ store: store._id });
      const categories = await Category.countDocuments({ store: store._id });
      const units = await Unit.countDocuments({ store: store._id });
      const labels = await ProductLabel.countDocuments({ store: store._id });
      const deliveries = await DeliveryMethod.countDocuments({ store: store._id });
      const payments = await PaymentMethod.countDocuments({ store: store._id });
      const ads = await Advertisement.countDocuments({ store: store._id });
      const sliders = await StoreSlider.countDocuments({ store: store._id });
      const terms = await TermsConditions.countDocuments({ store: store._id });
      const wholesalers = await Wholesaler.countDocuments({ store: store._id });
      const affiliations = await Affiliation.countDocuments({ store: store._id });
      const affiliatePayments = await AffiliatePayment.countDocuments({ store: store._id });
      
      //CONSOLE.log(`  📋 Product Specifications: ${specs}`);
      //CONSOLE.log(`  📦 Products: ${products}`);
      //CONSOLE.log(`  📂 Categories: ${categories}`);
      //CONSOLE.log(`  📏 Units: ${units}`);
      //CONSOLE.log(`  🏷️ Product Labels: ${labels}`);
      //CONSOLE.log(`  🚚 Delivery Methods: ${deliveries}`);
      //CONSOLE.log(`  💳 Payment Methods: ${payments}`);
      //CONSOLE.log(`  📢 Advertisements: ${ads}`);
      //CONSOLE.log(`  🎠 Store Sliders: ${sliders}`);
      //CONSOLE.log(`  📄 Terms & Conditions: ${terms}`);
      //CONSOLE.log(`  🏪 Wholesalers: ${wholesalers}`);
      //CONSOLE.log(`  🤝 Affiliations: ${affiliations}`);
      //CONSOLE.log(`  💰 Affiliate Payments: ${affiliatePayments}`);
    }
    
    // التحقق من البيانات بدون متجر
    //CONSOLE.log('\n🔍 Data without store:');
    const specsNoStore = await ProductSpecification.countDocuments({ store: { $exists: false } });
    const productsNoStore = await Product.countDocuments({ store: { $exists: false } });
    const categoriesNoStore = await Category.countDocuments({ store: { $exists: false } });
    
    //CONSOLE.log(`  📋 Product Specifications without store: ${specsNoStore}`);
    //CONSOLE.log(`  📦 Products without store: ${productsNoStore}`);
    //CONSOLE.log(`  📂 Categories without store: ${categoriesNoStore}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error checking store data:', error);
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('\n🔌 Database connection closed');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      //CONSOLE.log('🔗 Connected to MongoDB');
      checkStoreData();
    })
    .catch(err => {
      //CONSOLE.error('❌ Database connection error:', err);
      process.exit(1);
    });
}

module.exports = checkStoreData; 