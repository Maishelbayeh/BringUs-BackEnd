const mongoose = require('mongoose');
const DeliveryMethod = require('../Models/DeliveryMethod');
const Store = require('../Models/Store');

// Connect to MongoDB (using same connection as server.js)
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Store ID for which we're creating delivery methods
const STORE_ID = '686a719956a82bfcc93a2e2d';

// Delivery methods data for the store
const deliveryMethodsData = [
  {
    locationAr: 'الضفة الغربية',
    locationEn: 'West Bank',
    price: 25,
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
    price: 35,
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
    price: 75,
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
    price: 45,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل لقطاع غزة خلال يومين',
    descriptionEn: 'Delivery to Gaza Strip within two days',
    priority: 4
  },
  {
    locationAr: 'الخليل',
    locationEn: 'Hebron',
    price: 30,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل للخليل خلال يوم واحد',
    descriptionEn: 'Delivery to Hebron within one day',
    priority: 5
  },
  {
    locationAr: 'نابلس',
    locationEn: 'Nablus',
    price: 28,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل لنابلس خلال يوم واحد',
    descriptionEn: 'Delivery to Nablus within one day',
    priority: 6
  },
  {
    locationAr: 'رام الله',
    locationEn: 'Ramallah',
    price: 22,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل لرام الله خلال يوم واحد',
    descriptionEn: 'Delivery to Ramallah within one day',
    priority: 7
  },
  {
    locationAr: 'بيت لحم',
    locationEn: 'Bethlehem',
    price: 32,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل لبيت لحم خلال يوم واحد',
    descriptionEn: 'Delivery to Bethlehem within one day',
    priority: 8
  },
  {
    locationAr: 'أريحا',
    locationEn: 'Jericho',
    price: 40,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: 'توصيل لأريحا خلال يومين',
    descriptionEn: 'Delivery to Jericho within two days',
    priority: 9
  },
  {
    locationAr: 'طولكرم',
    locationEn: 'Tulkarm',
    price: 26,
    whatsappNumber: '+970598516067',
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: 'توصيل لطولكرم خلال يوم واحد',
    descriptionEn: 'Delivery to Tulkarm within one day',
    priority: 10
  }
];

async function createDeliveryMethodData() {
  try {
    console.log('🚀 Starting delivery method data creation...');

    // Verify store exists
    const store = await Store.findById(STORE_ID);
    if (!store) {
      console.error(`❌ Store with ID ${STORE_ID} not found`);
      process.exit(1);
    }
    console.log(`✅ Found store: ${store.nameEn} (${store.nameAr})`);

    // Clear existing delivery methods for this store
    const deletedCount = await DeliveryMethod.deleteMany({ store: STORE_ID });
    console.log(`🗑️  Deleted ${deletedCount.deletedCount} existing delivery methods`);

    // Create new delivery methods
    const deliveryMethods = deliveryMethodsData.map(method => ({
      ...method,
      store: STORE_ID
    }));

    const createdMethods = await DeliveryMethod.insertMany(deliveryMethods);
    console.log(`✅ Created ${createdMethods.length} delivery methods`);

    // Display created methods
    console.log('\n📋 Created Delivery Methods:');
    createdMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method.locationEn} (${method.locationAr})`);
      console.log(`   Price: ${method.price} ILS`);
      console.log(`   WhatsApp: ${method.whatsappNumber}`);
      console.log(`   Estimated Days: ${method.estimatedDays}`);
      console.log(`   Default: ${method.isDefault ? 'Yes' : 'No'}`);
      console.log(`   Active: ${method.isActive ? 'Yes' : 'No'}`);
      console.log(`   Priority: ${method.priority}`);
      console.log('');
    });

    console.log('🎉 Delivery method data creation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating delivery method data:', error);
    process.exit(1);
  }
}

// Run the script
createDeliveryMethodData(); 