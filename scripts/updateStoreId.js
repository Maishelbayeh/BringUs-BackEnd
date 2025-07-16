const mongoose = require('mongoose');

// Store IDs
const OLD_STORE_ID = '687505893fbf3098648bfe16';
const NEW_STORE_ID = '687505893fbf3098648bfe16';

async function updateStoreId() {
  try {
    //CONSOLE.log('🔄 Starting Store ID update process...');
    //CONSOLE.log(`📝 Updating from: ${OLD_STORE_ID}`);
    //CONSOLE.log(`📝 Updating to: ${NEW_STORE_ID}`);
    
    // التحقق من وجود المتجر الجديد
    const Store = require('../Models/Store');
    const newStore = await Store.findById(NEW_STORE_ID);
    
    if (!newStore) {
      //CONSOLE.log('❌ New store not found. Please create the store first.');
      return;
    }
    
    //CONSOLE.log(`✅ Found store: ${newStore.nameAr} (${newStore.nameEn})`);
    
    // تحديث ProductSpecifications
    const ProductSpecification = require('../Models/ProductSpecification');
    const specResult = await ProductSpecification.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${specResult.modifiedCount} product specifications`);
    
    // تحديث Products
    const Product = require('../Models/Product');
    const productResult = await Product.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${productResult.modifiedCount} products`);
    
    // تحديث Categories
    const Category = require('../Models/Category');
    const categoryResult = await Category.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${categoryResult.modifiedCount} categories`);
    
    // تحديث Units
    const Unit = require('../Models/Unit');
    const unitResult = await Unit.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${unitResult.modifiedCount} units`);
    
    // تحديث ProductLabels
    const ProductLabel = require('../Models/ProductLabel');
    const labelResult = await ProductLabel.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${labelResult.modifiedCount} product labels`);
    
    // تحديث DeliveryMethods
    const DeliveryMethod = require('../Models/DeliveryMethod');
    const deliveryResult = await DeliveryMethod.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${deliveryResult.modifiedCount} delivery methods`);
    
    // تحديث PaymentMethods
    const PaymentMethod = require('../Models/PaymentMethod');
    const paymentResult = await PaymentMethod.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${paymentResult.modifiedCount} payment methods`);
    
    // تحديث Advertisements
    const Advertisement = require('../Models/Advertisement');
    const adResult = await Advertisement.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${adResult.modifiedCount} advertisements`);
    
    // تحديث StoreSliders
    const StoreSlider = require('../Models/StoreSlider');
    const sliderResult = await StoreSlider.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${sliderResult.modifiedCount} store sliders`);
    
    // تحديث TermsConditions
    const TermsConditions = require('../Models/TermsConditions');
    const termsResult = await TermsConditions.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${termsResult.modifiedCount} terms & conditions`);
    
    // تحديث Wholesalers
    const Wholesaler = require('../Models/Wholesaler');
    const wholesalerResult = await Wholesaler.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${wholesalerResult.modifiedCount} wholesalers`);
    
    // تحديث Affiliations
    const Affiliation = require('../Models/Affiliation');
    const affiliationResult = await Affiliation.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${affiliationResult.modifiedCount} affiliations`);
    
    // تحديث AffiliatePayments
    const AffiliatePayment = require('../Models/AffiliatePayment');
    const paymentAffResult = await AffiliatePayment.updateMany(
      { store: OLD_STORE_ID },
      { store: NEW_STORE_ID }
    );
    //CONSOLE.log(`📊 Updated ${paymentAffResult.modifiedCount} affiliate payments`);
    
    //CONSOLE.log('🎉 Store ID update completed successfully!');
    
    // عرض إحصائيات نهائية
    const totalSpecs = await ProductSpecification.countDocuments({ store: NEW_STORE_ID });
    const totalProducts = await Product.countDocuments({ store: NEW_STORE_ID });
    const totalCategories = await Category.countDocuments({ store: NEW_STORE_ID });
    
    //CONSOLE.log('\n📈 Final Statistics:');
    //CONSOLE.log(`- Product Specifications: ${totalSpecs}`);
    //CONSOLE.log(`- Products: ${totalProducts}`);
    //CONSOLE.log(`- Categories: ${totalCategories}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error updating store ID:', error);
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
      updateStoreId();
    })
    .catch(err => {
      //CONSOLE.error('❌ Database connection error:', err);
      process.exit(1);
    });
}

module.exports = updateStoreId; 