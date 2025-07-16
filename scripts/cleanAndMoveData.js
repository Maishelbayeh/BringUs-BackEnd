const mongoose = require('mongoose');

// Store ID المطلوب
const TARGET_STORE_ID = '687505893fbf3098648bfe16';

async function cleanAndMoveData() {
  try {
    //CONSOLE.log('🔄 Starting clean and move data process...');
    //CONSOLE.log(`📝 Target Store ID: ${TARGET_STORE_ID}`);
    
    // التحقق من وجود المتجر المستهدف
    const Store = require('../Models/Store');
    const targetStore = await Store.findById(TARGET_STORE_ID);
    
    if (!targetStore) {
      //CONSOLE.log('❌ Target store not found. Please create the store first.');
      return;
    }
    
    //CONSOLE.log(`✅ Found target store: ${targetStore.nameAr} (${targetStore.nameEn})`);
    
    // ===== حذف جميع البيانات المرتبطة بالمتجر الجديد =====
    //CONSOLE.log('\n🗑️ Cleaning target store data...');
    
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
    
    // حذف البيانات
    const deletedSpecs = await ProductSpecification.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedSpecs.deletedCount} product specifications`);
    
    const deletedProducts = await Product.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedProducts.deletedCount} products`);
    
    const deletedCategories = await Category.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedCategories.deletedCount} categories`);
    
    const deletedUnits = await Unit.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedUnits.deletedCount} units`);
    
    const deletedLabels = await ProductLabel.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedLabels.deletedCount} product labels`);
    
    const deletedDeliveries = await DeliveryMethod.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedDeliveries.deletedCount} delivery methods`);
    
    const deletedPayments = await PaymentMethod.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedPayments.deletedCount} payment methods`);
    
    const deletedAds = await Advertisement.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedAds.deletedCount} advertisements`);
    
    const deletedSliders = await StoreSlider.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedSliders.deletedCount} store sliders`);
    
    const deletedTerms = await TermsConditions.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedTerms.deletedCount} terms & conditions`);
    
    const deletedWholesalers = await Wholesaler.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedWholesalers.deletedCount} wholesalers`);
    
    const deletedAffiliations = await Affiliation.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedAffiliations.deletedCount} affiliations`);
    
    const deletedAffiliatePayments = await AffiliatePayment.deleteMany({ store: TARGET_STORE_ID });
    //CONSOLE.log(`🗑️ Deleted ${deletedAffiliatePayments.deletedCount} affiliate payments`);
    
    //CONSOLE.log('✅ Target store cleaned successfully!');
    
    // ===== نقل جميع البيانات إلى المتجر الجديد =====
    //CONSOLE.log('\n📦 Moving all data to target store...');
    
    // نقل ProductSpecifications
    const specResult = await ProductSpecification.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${specResult.modifiedCount} product specifications to target store`);
    
    // نقل Products
    const productResult = await Product.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${productResult.modifiedCount} products to target store`);
    
    // نقل Categories
    const categoryResult = await Category.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${categoryResult.modifiedCount} categories to target store`);
    
    // نقل Units
    const unitResult = await Unit.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${unitResult.modifiedCount} units to target store`);
    
    // نقل ProductLabels
    const labelResult = await ProductLabel.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${labelResult.modifiedCount} product labels to target store`);
    
    // نقل DeliveryMethods
    const deliveryResult = await DeliveryMethod.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${deliveryResult.modifiedCount} delivery methods to target store`);
    
    // نقل PaymentMethods
    const paymentResult = await PaymentMethod.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${paymentResult.modifiedCount} payment methods to target store`);
    
    // نقل Advertisements
    const adResult = await Advertisement.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${adResult.modifiedCount} advertisements to target store`);
    
    // نقل StoreSliders
    const sliderResult = await StoreSlider.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${sliderResult.modifiedCount} store sliders to target store`);
    
    // نقل TermsConditions
    const termsResult = await TermsConditions.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${termsResult.modifiedCount} terms & conditions to target store`);
    
    // نقل Wholesalers
    const wholesalerResult = await Wholesaler.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${wholesalerResult.modifiedCount} wholesalers to target store`);
    
    // نقل Affiliations
    const affiliationResult = await Affiliation.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${affiliationResult.modifiedCount} affiliations to target store`);
    
    // نقل AffiliatePayments
    const paymentAffResult = await AffiliatePayment.updateMany(
      { store: { $ne: TARGET_STORE_ID } },
      { store: TARGET_STORE_ID }
    );
    //CONSOLE.log(`📊 Moved ${paymentAffResult.modifiedCount} affiliate payments to target store`);
    
    //CONSOLE.log('🎉 Data migration completed successfully!');
    
    // عرض إحصائيات نهائية
    const totalSpecs = await ProductSpecification.countDocuments({ store: TARGET_STORE_ID });
    const totalProducts = await Product.countDocuments({ store: TARGET_STORE_ID });
    const totalCategories = await Category.countDocuments({ store: TARGET_STORE_ID });
    const totalLabels = await ProductLabel.countDocuments({ store: TARGET_STORE_ID });
    const totalDeliveries = await DeliveryMethod.countDocuments({ store: TARGET_STORE_ID });
    const totalAds = await Advertisement.countDocuments({ store: TARGET_STORE_ID });
    const totalTerms = await TermsConditions.countDocuments({ store: TARGET_STORE_ID });
    const totalWholesalers = await Wholesaler.countDocuments({ store: TARGET_STORE_ID });
    const totalAffiliations = await Affiliation.countDocuments({ store: TARGET_STORE_ID });
    
    //CONSOLE.log('\n📈 Final Statistics for Target Store:');
    //CONSOLE.log(`- Product Specifications: ${totalSpecs}`);
    //CONSOLE.log(`- Products: ${totalProducts}`);
    //CONSOLE.log(`- Categories: ${totalCategories}`);
    //CONSOLE.log(`- Product Labels: ${totalLabels}`);
    //CONSOLE.log(`- Delivery Methods: ${totalDeliveries}`);
    //CONSOLE.log(`- Advertisements: ${totalAds}`);
    //CONSOLE.log(`- Terms & Conditions: ${totalTerms}`);
    //CONSOLE.log(`- Wholesalers: ${totalWholesalers}`);
    //CONSOLE.log(`- Affiliations: ${totalAffiliations}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error in clean and move process:', error);
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('🔌 Database connection closed');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      //CONSOLE.log('🔗 Connected to MongoDB');
      cleanAndMoveData();
    })
    .catch(err => {
      //CONSOLE.error('❌ Database connection error:', err);
      process.exit(1);
    });
}

module.exports = cleanAndMoveData; 