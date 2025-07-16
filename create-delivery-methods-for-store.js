const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bringus:bringus123@cluster0.mongodb.net/bringus?retryWrites=true&w=majority';

// Store ID
const STORE_ID = '687505893fbf3098648bfe16';

// Delivery methods data
const deliveryMethodsData = [
  {
    locationAr: "الضفة الغربية",
    locationEn: "West Bank",
    price: 20,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: true,
    estimatedDays: 1,
    descriptionAr: "توصيل سريع للضفة الغربية",
    descriptionEn: "Fast delivery to West Bank",
    priority: 1
  },
  {
    locationAr: "القدس",
    locationEn: "Jerusalem",
    price: 25,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: "توصيل للقدس",
    descriptionEn: "Delivery to Jerusalem",
    priority: 2
  },
  {
    locationAr: "غزة",
    locationEn: "Gaza",
    price: 30,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 3,
    descriptionAr: "توصيل لغزة",
    descriptionEn: "Delivery to Gaza",
    priority: 3
  },
  {
    locationAr: "الخليل",
    locationEn: "Hebron",
    price: 22,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: "توصيل للخليل",
    descriptionEn: "Delivery to Hebron",
    priority: 4
  },
  {
    locationAr: "نابلس",
    locationEn: "Nablus",
    price: 23,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: "توصيل لنابلس",
    descriptionEn: "Delivery to Nablus",
    priority: 5
  },
  {
    locationAr: "رام الله",
    locationEn: "Ramallah",
    price: 21,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 1,
    descriptionAr: "توصيل لرام الله",
    descriptionEn: "Delivery to Ramallah",
    priority: 6
  },
  {
    locationAr: "بيت لحم",
    locationEn: "Bethlehem",
    price: 24,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: "توصيل لبيت لحم",
    descriptionEn: "Delivery to Bethlehem",
    priority: 7
  },
  {
    locationAr: "أريحا",
    locationEn: "Jericho",
    price: 26,
    whatsappNumber: "+970598516067",
    isActive: true,
    isDefault: false,
    estimatedDays: 2,
    descriptionAr: "توصيل لأريحا",
    descriptionEn: "Delivery to Jericho",
    priority: 8
  }
];

// Delivery Method Schema
const deliveryMethodSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  locationAr: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  locationEn: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 10000
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  estimatedDays: {
    type: Number,
    default: 1,
    min: 1,
    max: 30
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  descriptionAr: {
    type: String,
    trim: true,
    maxlength: 500
  },
  descriptionEn: {
    type: String,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const DeliveryMethod = mongoose.model('DeliveryMethod', deliveryMethodSchema);

async function createDeliveryMethodsForStore() {
  try {
    //CONSOLE.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB successfully!');

    // Verify store exists
    const Store = mongoose.model('Store', new mongoose.Schema({}));
    const store = await Store.findById(STORE_ID);
    if (!store) {
      throw new Error(`Store with ID ${STORE_ID} not found`);
    }
    //CONSOLE.log(`✅ Store found: ${STORE_ID}`);

    // Clear existing delivery methods for this store
    //CONSOLE.log('🧹 Clearing existing delivery methods...');
    await DeliveryMethod.deleteMany({ store: STORE_ID });
    //CONSOLE.log('✅ Existing delivery methods cleared');

    // Add store ID to each delivery method
    const deliveryMethodsWithStore = deliveryMethodsData.map(method => ({
      ...method,
      store: STORE_ID
    }));

    // Insert new delivery methods
    //CONSOLE.log('📦 Creating new delivery methods...');
    const createdMethods = await DeliveryMethod.insertMany(deliveryMethodsWithStore);
    
    //CONSOLE.log(`✅ Successfully created ${createdMethods.length} delivery methods for store ${STORE_ID}`);
    
    // Display created methods
    //CONSOLE.log('\n📋 Created Delivery Methods:');
    createdMethods.forEach((method, index) => {
      //CONSOLE.log(`${index + 1}. ${method.locationEn} (${method.locationAr}) - $${method.price}`);
      if (method.isDefault) {
        //CONSOLE.log('   ⭐ Default method');
      }
    });

    // Verify creation
    const totalMethods = await DeliveryMethod.countDocuments({ store: STORE_ID });
    //CONSOLE.log(`\n📊 Total delivery methods for store: ${totalMethods}`);

    // Get default method
    const defaultMethod = await DeliveryMethod.findOne({ store: STORE_ID, isDefault: true });
    if (defaultMethod) {
      //CONSOLE.log(`\n⭐ Default method: ${defaultMethod.locationEn} (${defaultMethod.locationAr})`);
    }

  } catch (error) {
    //CONSOLE.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createDeliveryMethodsForStore(); 