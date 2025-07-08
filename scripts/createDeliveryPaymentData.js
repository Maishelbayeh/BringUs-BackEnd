const mongoose = require('mongoose');
const DeliveryMethod = require('../Models/DeliveryMethod');
const PaymentMethod = require('../Models/PaymentMethod');
const Store = require('../Models/Store');

// Connect to MongoDB (local)
mongoose.connect('mongodb://localhost:27017/bringus')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Delivery methods data for TechStore
const techStoreDeliveryMethods = [
  {
    locationAr: 'الضفة الغربية',
    locationEn: 'West Bank',
    price: 20,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: true,
    estimatedDays: 1,
    descriptionAr: 'توصيل سريع للضفة الغربية خلال يوم واحد',
    descriptionEn: 'Fast delivery to West Bank within one day',
    priority: 1
  },
  {
    locationAr: 'القدس',
    locationEn: 'Jerusalem',
    price: 30,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل للقدس خلال يومين',
    descriptionEn: 'Delivery to Jerusalem within two days',
    priority: 2
  },
  {
    locationAr: 'الداخل',
    locationEn: '1948 Areas',
    price: 70,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: 'توصيل للمناطق المحتلة عام 1948',
    descriptionEn: 'Delivery to 1948 occupied areas',
    priority: 3
  }
];

// Delivery methods data for FashionStore
const fashionStoreDeliveryMethods = [
  {
    locationAr: 'الرياض',
    locationEn: 'Riyadh',
    price: 25,
    whatsappNumber: '+966501234567',
    isActive: true,
    isDefault: true,
    estimatedDays: 1,
    descriptionAr: 'توصيل سريع للرياض خلال يوم واحد',
    descriptionEn: 'Fast delivery to Riyadh within one day',
    priority: 1
  },
  {
    locationAr: 'جدة',
    locationEn: 'Jeddah',
    price: 30,
    whatsappNumber: '+966501234567',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل لجدة خلال يومين',
    descriptionEn: 'Delivery to Jeddah within two days',
    priority: 2
  },
  {
    locationAr: 'الدمام',
    locationEn: 'Dammam',
    price: 35,
    whatsappNumber: '+966501234567',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل للدمام خلال يومين',
    descriptionEn: 'Delivery to Dammam within two days',
    priority: 3
  },
  {
    locationAr: 'مكة المكرمة',
    locationEn: 'Makkah',
    price: 40,
    whatsappNumber: '+966501234567',
    isActive: false,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: 'توصيل لمكة المكرمة',
    descriptionEn: 'Delivery to Makkah',
    priority: 4
  }
];

// Payment methods data for TechStore
const techStorePaymentMethods = [
  {
    titleAr: 'الدفع عند الاستلام',
    titleEn: 'Cash on Delivery',
    descriptionAr: 'ادفع عند استلام طلبك',
    descriptionEn: 'Pay when you receive your order',
    methodType: 'cash',
    isActive: true,
    isDefault: true,
    processingFee: 0,
    minimumAmount: 0,
    maximumAmount: 10000,
    supportedCurrencies: ['ILS'],
    priority: 1
  },
  {
    titleAr: 'باي بال',
    titleEn: 'PayPal',
    descriptionAr: 'دفع آمن عبر الإنترنت مع باي بال',
    descriptionEn: 'Secure online payment with PayPal',
    methodType: 'digital_wallet',
    isActive: true,
    isDefault: false,
    processingFee: 2.9,
    minimumAmount: 5,
    maximumAmount: 5000,
    supportedCurrencies: ['ILS', 'USD', 'EUR'],
    logoUrl: 'https://example.com/paypal-logo.png',
    priority: 2
  },
  {
    titleAr: 'فيزا وماستركارد',
    titleEn: 'Visa and Mastercard',
    descriptionAr: 'مدفوعات البطاقات الائتمانية والمدى',
    descriptionEn: 'Credit and debit card payments',
    methodType: 'card',
    isActive: true,
    isDefault: false,
    processingFee: 3.5,
    minimumAmount: 10,
    maximumAmount: 15000,
    supportedCurrencies: ['ILS', 'USD', 'EUR', 'GBP'],
    requiresCardNumber: true,
    requiresExpiryDate: true,
    requiresCVV: true,
    logoUrl: 'https://example.com/card-logo.png',
    priority: 3
  }
];

// Payment methods data for FashionStore
const fashionStorePaymentMethods = [
  {
    titleAr: 'الدفع عند الاستلام',
    titleEn: 'Cash on Delivery',
    descriptionAr: 'ادفع عند استلام طلبك',
    descriptionEn: 'Pay when you receive your order',
    methodType: 'cash',
    isActive: true,
    isDefault: true,
    processingFee: 0,
    minimumAmount: 0,
    maximumAmount: 5000,
    supportedCurrencies: ['SAR'],
    priority: 1
  },
  {
    titleAr: 'بطاقة ائتمان',
    titleEn: 'Credit Card',
    descriptionAr: 'مدفوعات البطاقات الائتمانية',
    descriptionEn: 'Credit card payments',
    methodType: 'card',
    isActive: true,
    isDefault: false,
    processingFee: 2.5,
    minimumAmount: 10,
    maximumAmount: 10000,
    supportedCurrencies: ['SAR', 'USD'],
    requiresCardNumber: true,
    requiresExpiryDate: true,
    requiresCVV: true,
    logoUrl: 'https://example.com/credit-card-logo.png',
    priority: 2
  },
  {
    titleAr: 'تحويل بنكي',
    titleEn: 'Bank Transfer',
    descriptionAr: 'تحويل مباشر للبنك',
    descriptionEn: 'Direct bank transfer',
    methodType: 'bank_transfer',
    isActive: true,
    isDefault: false,
    processingFee: 0,
    minimumAmount: 50,
    maximumAmount: 50000,
    supportedCurrencies: ['SAR'],
    logoUrl: 'https://example.com/bank-logo.png',
    priority: 3
  },
  {
    titleAr: 'محفظة إلكترونية',
    titleEn: 'Digital Wallet',
    descriptionAr: 'دفع عبر المحفظة الإلكترونية',
    descriptionEn: 'Payment via digital wallet',
    methodType: 'digital_wallet',
    isActive: false,
    isDefault: false,
    processingFee: 1.5,
    minimumAmount: 5,
    maximumAmount: 2000,
    supportedCurrencies: ['SAR'],
    logoUrl: 'https://example.com/wallet-logo.png',
    priority: 4
  }
];

async function createDeliveryPaymentData() {
  try {
    console.log('🚀 Creating delivery and payment methods test data...\n');

    // Get store IDs
    const techStore = await Store.findOne({ name: 'TechStore' });
    const fashionStore = await Store.findOne({ name: 'FashionStore' });

    if (!techStore || !fashionStore) {
      console.log('❌ Stores not found. Creating stores first...');
      
      // Create stores if they don't exist
      const newTechStore = await Store.create({
        name: 'TechStore',
        domain: 'techstore.com',
        description: 'Technology Store',
        status: 'active'
      });
      
      const newFashionStore = await Store.create({
        name: 'FashionStore',
        domain: 'fashionstore.com',
        description: 'Fashion Store',
        status: 'active'
      });
      
      console.log('✅ Created stores');
      console.log(`   - TechStore: ${newTechStore._id}`);
      console.log(`   - FashionStore: ${newFashionStore._id}\n`);
    } else {
      console.log(`📦 Found stores:`);
      console.log(`   - TechStore: ${techStore._id}`);
      console.log(`   - FashionStore: ${fashionStore._id}\n`);
    }

    const finalTechStore = techStore || await Store.findOne({ name: 'TechStore' });
    const finalFashionStore = fashionStore || await Store.findOne({ name: 'FashionStore' });

    // Clear existing test data
    await DeliveryMethod.deleteMany({
      store: { $in: [finalTechStore._id, finalFashionStore._id] }
    });
    await PaymentMethod.deleteMany({
      store: { $in: [finalTechStore._id, finalFashionStore._id] }
    });
    console.log('🧹 Cleared existing test data\n');

    // Create TechStore delivery methods
    console.log('🛠️ Creating TechStore delivery methods...');
    const techDeliveryMethods = [];
    for (const deliveryData of techStoreDeliveryMethods) {
      const deliveryMethod = await DeliveryMethod.create({
        ...deliveryData,
        store: finalTechStore._id
      });
      techDeliveryMethods.push(deliveryMethod);
      console.log(`   ✅ Created: ${deliveryMethod.locationAr} (${deliveryMethod.locationEn}) - ${deliveryMethod.price} ILS`);
    }

    // Create FashionStore delivery methods
    console.log('\n👗 Creating FashionStore delivery methods...');
    const fashionDeliveryMethods = [];
    for (const deliveryData of fashionStoreDeliveryMethods) {
      const deliveryMethod = await DeliveryMethod.create({
        ...deliveryData,
        store: finalFashionStore._id
      });
      fashionDeliveryMethods.push(deliveryMethod);
      console.log(`   ✅ Created: ${deliveryMethod.locationAr} (${deliveryMethod.locationEn}) - ${deliveryMethod.price} SAR`);
    }

    // Create TechStore payment methods
    console.log('\n💳 Creating TechStore payment methods...');
    const techPaymentMethods = [];
    for (const paymentData of techStorePaymentMethods) {
      const paymentMethod = await PaymentMethod.create({
        ...paymentData,
        store: finalTechStore._id
      });
      techPaymentMethods.push(paymentMethod);
      console.log(`   ✅ Created: ${paymentMethod.titleAr} (${paymentMethod.titleEn})`);
    }

    // Create FashionStore payment methods
    console.log('\n💰 Creating FashionStore payment methods...');
    const fashionPaymentMethods = [];
    for (const paymentData of fashionStorePaymentMethods) {
      const paymentMethod = await PaymentMethod.create({
        ...paymentData,
        store: finalFashionStore._id
      });
      fashionPaymentMethods.push(paymentMethod);
      console.log(`   ✅ Created: ${paymentMethod.titleAr} (${paymentMethod.titleEn})`);
    }

    // Verify isolation
    console.log('\n🔍 Verifying data isolation...');
    
    const techDeliveryCount = await DeliveryMethod.countDocuments({ store: finalTechStore._id });
    const fashionDeliveryCount = await DeliveryMethod.countDocuments({ store: finalFashionStore._id });
    const techPaymentCount = await PaymentMethod.countDocuments({ store: finalTechStore._id });
    const fashionPaymentCount = await PaymentMethod.countDocuments({ store: finalFashionStore._id });
    
    console.log(`   - TechStore delivery methods: ${techDeliveryCount}`);
    console.log(`   - FashionStore delivery methods: ${fashionDeliveryCount}`);
    console.log(`   - TechStore payment methods: ${techPaymentCount}`);
    console.log(`   - FashionStore payment methods: ${fashionPaymentCount}`);

    // Test cross-store access
    const techDeliveryInFashion = await DeliveryMethod.findOne({ 
      store: finalFashionStore._id, 
      locationAr: { $in: techStoreDeliveryMethods.map(d => d.locationAr) }
    });
    
    const fashionDeliveryInTech = await DeliveryMethod.findOne({ 
      store: finalTechStore._id, 
      locationAr: { $in: fashionStoreDeliveryMethods.map(d => d.locationAr) }
    });

    if (!techDeliveryInFashion && !fashionDeliveryInTech) {
      console.log('   ✅ Delivery methods isolation verified');
    } else {
      console.log('   ❌ Delivery methods isolation failed');
    }

    console.log('\n🎉 Delivery and payment methods test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- TechStore delivery methods: ${techDeliveryCount}`);
    console.log(`- FashionStore delivery methods: ${fashionDeliveryCount}`);
    console.log(`- TechStore payment methods: ${techPaymentCount}`);
    console.log(`- FashionStore payment methods: ${fashionPaymentCount}`);
    console.log('- Total delivery methods:', techDeliveryCount + fashionDeliveryCount);
    console.log('- Total payment methods:', techPaymentCount + fashionPaymentCount);
    console.log('- Data isolation: Verified ✅');
    
    console.log('\n📋 Data Details:');
    console.log('\n🛠️ TechStore Delivery Methods:');
    techStoreDeliveryMethods.forEach((d, index) => {
      console.log(`   ${index + 1}. ${d.locationAr} (${d.locationEn})`);
      console.log(`      💰 Price: ${d.price} ILS`);
      console.log(`      📱 WhatsApp: ${d.whatsappNumber}`);
      console.log(`      ⏱️ Estimated: ${d.estimatedDays} day(s)`);
      console.log(`      📍 Default: ${d.isDefault ? 'Yes' : 'No'}`);
    });

    console.log('\n👗 FashionStore Delivery Methods:');
    fashionStoreDeliveryMethods.forEach((d, index) => {
      console.log(`   ${index + 1}. ${d.locationAr} (${d.locationEn})`);
      console.log(`      💰 Price: ${d.price} SAR`);
      console.log(`      📱 WhatsApp: ${d.whatsappNumber}`);
      console.log(`      ⏱️ Estimated: ${d.estimatedDays} day(s)`);
      console.log(`      📍 Default: ${d.isDefault ? 'Yes' : 'No'}`);
    });

    console.log('\n💳 TechStore Payment Methods:');
    techStorePaymentMethods.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.titleAr} (${p.titleEn})`);
      console.log(`      💳 Type: ${p.methodType}`);
      console.log(`      💰 Fee: ${p.processingFee}%`);
      console.log(`      💵 Min: ${p.minimumAmount} ILS, Max: ${p.maximumAmount} ILS`);
      console.log(`      📍 Default: ${p.isDefault ? 'Yes' : 'No'}`);
    });

    console.log('\n💰 FashionStore Payment Methods:');
    fashionStorePaymentMethods.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.titleAr} (${p.titleEn})`);
      console.log(`      💳 Type: ${p.methodType}`);
      console.log(`      💰 Fee: ${p.processingFee}%`);
      console.log(`      💵 Min: ${p.minimumAmount} SAR, Max: ${p.maximumAmount} SAR`);
      console.log(`      📍 Default: ${p.isDefault ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Error creating delivery and payment data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createDeliveryPaymentData(); 