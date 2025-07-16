/**
 * Create Delivery and Payment Data for Specific Stores
 * 
 * This script creates delivery and payment methods for three specific stores:
 * - Store 1: 687505893fbf3098648bfe16
 * - Store 2: 686a719a56a82bfcc93a2e32  
 * - Store 3: 686a42835d3be132500ac5f4
 * 
 * Usage:
 *   node scripts/createDeliveryPaymentForStores.js
 * 
 * Features:
 * - Creates delivery methods for different locations per store
 * - Creates payment methods with various types per store
 * - Demonstrates store isolation
 * - Includes comprehensive test data
 */

const mongoose = require('mongoose');
const DeliveryMethod = require('../Models/DeliveryMethod');
const PaymentMethod = require('../Models/PaymentMethod');
const Store = require('../Models/Store');

// Connect to MongoDB Atlas - using the same connection as server.js
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  // Removed deprecated options for newer MongoDB driver
})
.then(() => //CONSOLE.log('✅ Connected to MongoDB Atlas'))
.catch(err => //CONSOLE.error('❌ MongoDB connection error:', err));

// Store IDs
const STORE_IDS = {
  STORE_1: '687505893fbf3098648bfe16',
  STORE_2: '686a719a56a82bfcc93a2e32',
  STORE_3: '686a42835d3be132500ac5f4'
};

// Delivery methods data for Store 1 (Tech/Electronics Store)
const store1DeliveryMethods = [
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
  },
  {
    locationAr: 'غزة',
    locationEn: 'Gaza',
    price: 50,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 4,
    descriptionAr: 'توصيل لقطاع غزة',
    descriptionEn: 'Delivery to Gaza Strip',
    priority: 4
  }
];

// Delivery methods data for Store 2 (Fashion/Clothing Store)
const store2DeliveryMethods = [
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
    isActive: true,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: 'توصيل لمكة المكرمة',
    descriptionEn: 'Delivery to Makkah',
    priority: 4
  },
  {
    locationAr: 'المدينة المنورة',
    locationEn: 'Madinah',
    price: 45,
    whatsappNumber: '+966501234567',
    isActive: false,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: 'توصيل للمدينة المنورة',
    descriptionEn: 'Delivery to Madinah',
    priority: 5
  }
];

// Delivery methods data for Store 3 (Food/Grocery Store)
const store3DeliveryMethods = [
  {
    locationAr: 'عمان',
    locationEn: 'Amman',
    price: 15,
    whatsappNumber: '+962791234567',
    isActive: true,
    isDefault: true,
    estimatedDays: 1,
    descriptionAr: 'توصيل سريع في عمان خلال ساعات',
    descriptionEn: 'Fast delivery in Amman within hours',
    priority: 1
  },
  {
    locationAr: 'الزرقاء',
    locationEn: 'Zarqa',
    price: 20,
    whatsappNumber: '+962791234567',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل للزرقاء خلال يوم واحد',
    descriptionEn: 'Delivery to Zarqa within one day',
    priority: 2
  },
  {
    locationAr: 'إربد',
    locationEn: 'Irbid',
    price: 25,
    whatsappNumber: '+962791234567',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل لإربد خلال يومين',
    descriptionEn: 'Delivery to Irbid within two days',
    priority: 3
  },
  {
    locationAr: 'العقبة',
    locationEn: 'Aqaba',
    price: 35,
    whatsappNumber: '+962791234567',
    isActive: true,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: 'توصيل للعقبة خلال ثلاثة أيام',
    descriptionEn: 'Delivery to Aqaba within three days',
    priority: 4
  }
];

// Payment methods data for Store 1 (Tech/Electronics)
const store1PaymentMethods = [
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
    supportedCurrencies: ['ILS'],
    logoUrl: 'https://example.com/bank-logo.png',
    priority: 4
  }
];

// Payment methods data for Store 2 (Fashion/Clothing)
const store2PaymentMethods = [
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
    titleAr: 'محفظة إلكترونية',
    titleEn: 'Digital Wallet',
    descriptionAr: 'دفع عبر المحفظة الإلكترونية',
    descriptionEn: 'Payment via digital wallet',
    methodType: 'digital_wallet',
    isActive: true,
    isDefault: false,
    processingFee: 1.5,
    minimumAmount: 5,
    maximumAmount: 2000,
    supportedCurrencies: ['SAR'],
    logoUrl: 'https://example.com/wallet-logo.png',
    priority: 3
  },
  {
    titleAr: 'Apple Pay',
    titleEn: 'Apple Pay',
    descriptionAr: 'دفع آمن عبر Apple Pay',
    descriptionEn: 'Secure payment via Apple Pay',
    methodType: 'digital_wallet',
    isActive: true,
    isDefault: false,
    processingFee: 1.0,
    minimumAmount: 5,
    maximumAmount: 3000,
    supportedCurrencies: ['SAR', 'USD'],
    logoUrl: 'https://example.com/apple-pay-logo.png',
    priority: 4
  }
];

// Payment methods data for Store 3 (Food/Grocery)
const store3PaymentMethods = [
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
    maximumAmount: 2000,
    supportedCurrencies: ['JOD'],
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
    processingFee: 2.0,
    minimumAmount: 5,
    maximumAmount: 5000,
    supportedCurrencies: ['JOD', 'USD'],
    requiresCardNumber: true,
    requiresExpiryDate: true,
    requiresCVV: true,
    logoUrl: 'https://example.com/credit-card-logo.png',
    priority: 2
  },
  {
    titleAr: 'محفظة إلكترونية',
    titleEn: 'Digital Wallet',
    descriptionAr: 'دفع عبر المحفظة الإلكترونية',
    descriptionEn: 'Payment via digital wallet',
    methodType: 'digital_wallet',
    isActive: true,
    isDefault: false,
    processingFee: 1.0,
    minimumAmount: 2,
    maximumAmount: 1000,
    supportedCurrencies: ['JOD'],
    logoUrl: 'https://example.com/wallet-logo.png',
    priority: 3
  }
];

async function createDeliveryPaymentForStores() {
  try {
    //CONSOLE.log('🚀 Creating delivery and payment methods for specific stores...\n');

    // Wait for connection to be established
    await mongoose.connection.asPromise();

    // Verify stores exist
    //CONSOLE.log('🔍 Verifying stores exist...');
    const store1 = await Store.findById(STORE_IDS.STORE_1);
    const store2 = await Store.findById(STORE_IDS.STORE_2);
    const store3 = await Store.findById(STORE_IDS.STORE_3);

    if (!store1 || !store2 || !store3) {
      //CONSOLE.log('❌ One or more stores not found:');
      //CONSOLE.log(`   Store 1 (${STORE_IDS.STORE_1}): ${store1 ? 'Found' : 'Not Found'}`);
      //CONSOLE.log(`   Store 2 (${STORE_IDS.STORE_2}): ${store2 ? 'Found' : 'Not Found'}`);
      //CONSOLE.log(`   Store 3 (${STORE_IDS.STORE_3}): ${store3 ? 'Found' : 'Not Found'}`);
      return;
    }

    //CONSOLE.log('✅ All stores found:');
    //CONSOLE.log(`   Store 1: ${store1.name || 'Unknown'} (${STORE_IDS.STORE_1})`);
    //CONSOLE.log(`   Store 2: ${store2.name || 'Unknown'} (${STORE_IDS.STORE_2})`);
    //CONSOLE.log(`   Store 3: ${store3.name || 'Unknown'} (${STORE_IDS.STORE_3})\n`);

    // Clear existing delivery and payment methods for these stores
    await DeliveryMethod.deleteMany({
      store: { $in: [STORE_IDS.STORE_1, STORE_IDS.STORE_2, STORE_IDS.STORE_3] }
    });
    await PaymentMethod.deleteMany({
      store: { $in: [STORE_IDS.STORE_1, STORE_IDS.STORE_2, STORE_IDS.STORE_3] }
    });
    //CONSOLE.log('🧹 Cleared existing delivery and payment methods for these stores\n');

    // Create delivery methods for Store 1
    //CONSOLE.log('🛠️ Creating delivery methods for Store 1 (Tech/Electronics)...');
    const store1Delivery = [];
    for (const deliveryData of store1DeliveryMethods) {
      const deliveryMethod = await DeliveryMethod.create({
        ...deliveryData,
        store: STORE_IDS.STORE_1
      });
      store1Delivery.push(deliveryMethod);
      //CONSOLE.log(`   ✅ Created: ${deliveryMethod.locationAr} (${deliveryMethod.locationEn}) - ${deliveryMethod.price} ILS`);
    }

    // Create delivery methods for Store 2
    //CONSOLE.log('\n👗 Creating delivery methods for Store 2 (Fashion/Clothing)...');
    const store2Delivery = [];
    for (const deliveryData of store2DeliveryMethods) {
      const deliveryMethod = await DeliveryMethod.create({
        ...deliveryData,
        store: STORE_IDS.STORE_2
      });
      store2Delivery.push(deliveryMethod);
      //CONSOLE.log(`   ✅ Created: ${deliveryMethod.locationAr} (${deliveryMethod.locationEn}) - ${deliveryMethod.price} SAR`);
    }

    // Create delivery methods for Store 3
    //CONSOLE.log('\n🛒 Creating delivery methods for Store 3 (Food/Grocery)...');
    const store3Delivery = [];
    for (const deliveryData of store3DeliveryMethods) {
      const deliveryMethod = await DeliveryMethod.create({
        ...deliveryData,
        store: STORE_IDS.STORE_3
      });
      store3Delivery.push(deliveryMethod);
      //CONSOLE.log(`   ✅ Created: ${deliveryMethod.locationAr} (${deliveryMethod.locationEn}) - ${deliveryMethod.price} JOD`);
    }

    // Create payment methods for Store 1
    //CONSOLE.log('\n💳 Creating payment methods for Store 1 (Tech/Electronics)...');
    const store1Payment = [];
    for (const paymentData of store1PaymentMethods) {
      const paymentMethod = await PaymentMethod.create({
        ...paymentData,
        store: STORE_IDS.STORE_1
      });
      store1Payment.push(paymentMethod);
      //CONSOLE.log(`   ✅ Created: ${paymentMethod.titleAr} (${paymentMethod.titleEn})`);
    }

    // Create payment methods for Store 2
    //CONSOLE.log('\n💰 Creating payment methods for Store 2 (Fashion/Clothing)...');
    const store2Payment = [];
    for (const paymentData of store2PaymentMethods) {
      const paymentMethod = await PaymentMethod.create({
        ...paymentData,
        store: STORE_IDS.STORE_2
      });
      store2Payment.push(paymentMethod);
      //CONSOLE.log(`   ✅ Created: ${paymentMethod.titleAr} (${paymentMethod.titleEn})`);
    }

    // Create payment methods for Store 3
    //CONSOLE.log('\n🍎 Creating payment methods for Store 3 (Food/Grocery)...');
    const store3Payment = [];
    for (const paymentData of store3PaymentMethods) {
      const paymentMethod = await PaymentMethod.create({
        ...paymentData,
        store: STORE_IDS.STORE_3
      });
      store3Payment.push(paymentMethod);
      //CONSOLE.log(`   ✅ Created: ${paymentMethod.titleAr} (${paymentMethod.titleEn})`);
    }

    // Verify data creation
    //CONSOLE.log('\n🔍 Verifying data creation...');
    
    const store1DeliveryCount = await DeliveryMethod.countDocuments({ store: STORE_IDS.STORE_1 });
    const store2DeliveryCount = await DeliveryMethod.countDocuments({ store: STORE_IDS.STORE_2 });
    const store3DeliveryCount = await DeliveryMethod.countDocuments({ store: STORE_IDS.STORE_3 });
    
    const store1PaymentCount = await PaymentMethod.countDocuments({ store: STORE_IDS.STORE_1 });
    const store2PaymentCount = await PaymentMethod.countDocuments({ store: STORE_IDS.STORE_2 });
    const store3PaymentCount = await PaymentMethod.countDocuments({ store: STORE_IDS.STORE_3 });
    
    //CONSOLE.log(`   Store 1: ${store1DeliveryCount} delivery methods, ${store1PaymentCount} payment methods`);
    //CONSOLE.log(`   Store 2: ${store2DeliveryCount} delivery methods, ${store2PaymentCount} payment methods`);
    //CONSOLE.log(`   Store 3: ${store3DeliveryCount} delivery methods, ${store3PaymentCount} payment methods`);

    // Test isolation
    //CONSOLE.log('\n🔒 Testing data isolation...');
    const crossStoreDelivery = await DeliveryMethod.findOne({
      store: STORE_IDS.STORE_1,
      locationAr: { $in: store2DeliveryMethods.map(d => d.locationAr) }
    });
    
    if (!crossStoreDelivery) {
      //CONSOLE.log('   ✅ Data isolation verified - no cross-store data found');
    } else {
      //CONSOLE.log('   ❌ Data isolation failed - cross-store data found');
    }

    //CONSOLE.log('\n🎉 Delivery and payment methods created successfully!');
    //CONSOLE.log('\n📊 Summary:');
    //CONSOLE.log(`- Store 1 (${STORE_IDS.STORE_1}): ${store1DeliveryCount} delivery, ${store1PaymentCount} payment methods`);
    //CONSOLE.log(`- Store 2 (${STORE_IDS.STORE_2}): ${store2DeliveryCount} delivery, ${store2PaymentCount} payment methods`);
    //CONSOLE.log(`- Store 3 (${STORE_IDS.STORE_3}): ${store3DeliveryCount} delivery, ${store3PaymentCount} payment methods`);
    //CONSOLE.log(`- Total delivery methods: ${store1DeliveryCount + store2DeliveryCount + store3DeliveryCount}`);
    //CONSOLE.log(`- Total payment methods: ${store1PaymentCount + store2PaymentCount + store3PaymentCount}`);
    
    //CONSOLE.log('\n📋 Data Details:');
    
    //CONSOLE.log('\n🛠️ Store 1 Delivery Methods (Tech/Electronics):');
    store1DeliveryMethods.forEach((d, index) => {
      //CONSOLE.log(`   ${index + 1}. ${d.locationAr} (${d.locationEn})`);
      //CONSOLE.log(`      💰 Price: ${d.price} ILS`);
      //CONSOLE.log(`      📱 WhatsApp: ${d.whatsappNumber}`);
      //CONSOLE.log(`      ⏱️ Estimated: ${d.estimatedDays} day(s)`);
      //CONSOLE.log(`      📍 Default: ${d.isDefault ? 'Yes' : 'No'}`);
    });

    //CONSOLE.log('\n👗 Store 2 Delivery Methods (Fashion/Clothing):');
    store2DeliveryMethods.forEach((d, index) => {
      //CONSOLE.log(`   ${index + 1}. ${d.locationAr} (${d.locationEn})`);
      //CONSOLE.log(`      💰 Price: ${d.price} SAR`);
      //CONSOLE.log(`      📱 WhatsApp: ${d.whatsappNumber}`);
      //CONSOLE.log(`      ⏱️ Estimated: ${d.estimatedDays} day(s)`);
      //CONSOLE.log(`      📍 Default: ${d.isDefault ? 'Yes' : 'No'}`);
    });

    //CONSOLE.log('\n🛒 Store 3 Delivery Methods (Food/Grocery):');
    store3DeliveryMethods.forEach((d, index) => {
      //CONSOLE.log(`   ${index + 1}. ${d.locationAr} (${d.locationEn})`);
      //CONSOLE.log(`      💰 Price: ${d.price} JOD`);
      //CONSOLE.log(`      📱 WhatsApp: ${d.whatsappNumber}`);
      //CONSOLE.log(`      ⏱️ Estimated: ${d.estimatedDays} day(s)`);
      //CONSOLE.log(`      📍 Default: ${d.isDefault ? 'Yes' : 'No'}`);
    });

    //CONSOLE.log('\n💳 Store 1 Payment Methods (Tech/Electronics):');
    store1PaymentMethods.forEach((p, index) => {
      //CONSOLE.log(`   ${index + 1}. ${p.titleAr} (${p.titleEn})`);
      //CONSOLE.log(`      💳 Type: ${p.methodType}`);
      //CONSOLE.log(`      💰 Fee: ${p.processingFee}%`);
      //CONSOLE.log(`      💵 Min: ${p.minimumAmount} ILS, Max: ${p.maximumAmount} ILS`);
      //CONSOLE.log(`      📍 Default: ${p.isDefault ? 'Yes' : 'No'}`);
    });

    //CONSOLE.log('\n💰 Store 2 Payment Methods (Fashion/Clothing):');
    store2PaymentMethods.forEach((p, index) => {
      //CONSOLE.log(`   ${index + 1}. ${p.titleAr} (${p.titleEn})`);
      //CONSOLE.log(`      💳 Type: ${p.methodType}`);
      //CONSOLE.log(`      💰 Fee: ${p.processingFee}%`);
      //CONSOLE.log(`      💵 Min: ${p.minimumAmount} SAR, Max: ${p.maximumAmount} SAR`);
      //CONSOLE.log(`      📍 Default: ${p.isDefault ? 'Yes' : 'No'}`);
    });

    //CONSOLE.log('\n🍎 Store 3 Payment Methods (Food/Grocery):');
    store3PaymentMethods.forEach((p, index) => {
      //CONSOLE.log(`   ${index + 1}. ${p.titleAr} (${p.titleEn})`);
      //CONSOLE.log(`      💳 Type: ${p.methodType}`);
      //CONSOLE.log(`      💰 Fee: ${p.processingFee}%`);
      //CONSOLE.log(`      💵 Min: ${p.minimumAmount} JOD, Max: ${p.maximumAmount} JOD`);
      //CONSOLE.log(`      📍 Default: ${p.isDefault ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    //CONSOLE.error('❌ Error creating delivery and payment data:', error);
  } finally {
    await mongoose.connection.close();
    //CONSOLE.log('\n🔌 Database connection closed');
  }
}

// Run the script
createDeliveryPaymentForStores(); 