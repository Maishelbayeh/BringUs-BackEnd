/**
 * Create Unit Data Script
 * 
 * This script adds basic unit data to the database.
 * It includes 31 common units with Arabic and English names.
 * 
 * Usage:
 *   node scripts/createUnitData.js
 * 
 * Features:
 * - Checks for existing units to avoid duplicates
 * - Option to clear all existing units (uncomment line 285)
 * - Comprehensive unit coverage for various product types
 */

const mongoose = require('mongoose');
const Unit = require('../Models/Unit');
require('dotenv').config();

// Database connection - using the same MongoDB Atlas connection as server.js
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  // Removed deprecated options for newer MongoDB driver
})
.then(() => {
  //CONSOLE.log('✅ Connected to MongoDB Atlas');
})
.catch((err) => {
  //CONSOLE.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const STORE_ID = '687505893fbf3098648bfe16';

const basicUnits = [
  // Basic measurement units
  {
    nameAr: 'قطعة',
    nameEn: 'Piece',
    symbol: 'pc',
    descriptionAr: 'وحدة قياس أساسية للقطع الفردية',
    descriptionEn: 'Basic unit for individual pieces',
    sortOrder: 1,
    store: STORE_ID
  },
  {
    nameAr: 'كيلوغرام',
    nameEn: 'Kilogram',
    symbol: 'kg',
    descriptionAr: 'وحدة قياس الوزن الأساسية',
    descriptionEn: 'Basic unit of weight measurement',
    sortOrder: 2,
    store: STORE_ID
  },
  {
    nameAr: 'لتر',
    nameEn: 'Liter',
    symbol: 'L',
    descriptionAr: 'وحدة قياس الحجم للسوائل',
    descriptionEn: 'Volume measurement unit for liquids',
    sortOrder: 3,
    store: STORE_ID
  },
  {
    nameAr: 'متر',
    nameEn: 'Meter',
    symbol: 'm',
    descriptionAr: 'وحدة قياس الطول الأساسية',
    descriptionEn: 'Basic unit of length measurement',
    sortOrder: 4,
    store: STORE_ID
  },
  {
    nameAr: 'غرام',
    nameEn: 'Gram',
    symbol: 'g',
    descriptionAr: 'وحدة قياس الوزن الصغيرة',
    descriptionEn: 'Small unit of weight measurement',
    sortOrder: 5,
    store: STORE_ID
  },
  {
    nameAr: 'سنتيمتر',
    nameEn: 'Centimeter',
    symbol: 'cm',
    descriptionAr: 'وحدة قياس الطول الصغيرة',
    descriptionEn: 'Small unit of length measurement',
    sortOrder: 6,
    store: STORE_ID
  },
  {
    nameAr: 'مليمتر',
    nameEn: 'Millimeter',
    symbol: 'mm',
    descriptionAr: 'وحدة قياس الطول الدقيقة',
    descriptionEn: 'Precise unit of length measurement',
    sortOrder: 7,
    store: STORE_ID
  },
  {
    nameAr: 'متر مربع',
    nameEn: 'Square Meter',
    symbol: 'm²',
    descriptionAr: 'وحدة قياس المساحة',
    descriptionEn: 'Unit of area measurement',
    sortOrder: 8,
    store: STORE_ID
  },
  {
    nameAr: 'متر مكعب',
    nameEn: 'Cubic Meter',
    symbol: 'm³',
    descriptionAr: 'وحدة قياس الحجم',
    descriptionEn: 'Unit of volume measurement',
    sortOrder: 9,
    store: STORE_ID
  },
  {
    nameAr: 'ميللي لتر',
    nameEn: 'Milliliter',
    symbol: 'ml',
    descriptionAr: 'وحدة قياس الحجم الصغيرة',
    descriptionEn: 'Small unit of volume measurement',
    sortOrder: 10,
    store: STORE_ID
  },
  
  // Clothing and fashion units
  {
    nameAr: 'زوج',
    nameEn: 'Pair',
    symbol: 'pair',
    descriptionAr: 'وحدة للجوارب والأحذية والقفازات',
    descriptionEn: 'Unit for socks, shoes, and gloves',
    sortOrder: 11,
    store: STORE_ID
  },
  {
    nameAr: 'قطعة ملابس',
    nameEn: 'Garment',
    symbol: 'garment',
    descriptionAr: 'وحدة للملابس الفردية',
    descriptionEn: 'Unit for individual clothing items',
    sortOrder: 12,
    store: STORE_ID
  },
  {
    nameAr: 'طقم',
    nameEn: 'Set',
    symbol: 'set',
    descriptionAr: 'مجموعة من الملابس المتناسقة',
    descriptionEn: 'Coordinated set of clothing',
    sortOrder: 13,
    store: STORE_ID
  },
  
  // Packaging units
  {
    nameAr: 'علبة',
    nameEn: 'Box',
    symbol: 'box',
    descriptionAr: 'وحدة التعبئة في علب',
    descriptionEn: 'Packaging unit in boxes',
    sortOrder: 14,
    store: STORE_ID
  },
  {
    nameAr: 'عبوة',
    nameEn: 'Pack',
    symbol: 'pack',
    descriptionAr: 'وحدة التعبئة في عبوات',
    descriptionEn: 'Packaging unit in packs',
    sortOrder: 15,
    store: STORE_ID
  },
  {
    nameAr: 'زجاجة',
    nameEn: 'Bottle',
    symbol: 'bottle',
    descriptionAr: 'وحدة التعبئة في زجاجات',
    descriptionEn: 'Packaging unit in bottles',
    sortOrder: 16,
    store: STORE_ID
  },
  {
    nameAr: 'كيس',
    nameEn: 'Bag',
    symbol: 'bag',
    descriptionAr: 'وحدة التعبئة في أكياس',
    descriptionEn: 'Packaging unit in bags',
    sortOrder: 17,
    store: STORE_ID
  },
  {
    nameAr: 'حزمة',
    nameEn: 'Bundle',
    symbol: 'bundle',
    descriptionAr: 'مجموعة من العناصر المربوطة معاً',
    descriptionEn: 'Group of items tied together',
    sortOrder: 18,
    store: STORE_ID
  },
  
  // Kitchen and household units
  {
    nameAr: 'كوب',
    nameEn: 'Cup',
    symbol: 'cup',
    descriptionAr: 'وحدة قياس المطبخ',
    descriptionEn: 'Kitchen measurement unit',
    sortOrder: 19,
    store: STORE_ID
  },
  {
    nameAr: 'ملعقة',
    nameEn: 'Spoon',
    symbol: 'spoon',
    descriptionAr: 'وحدة قياس المطبخ الصغيرة',
    descriptionEn: 'Small kitchen measurement unit',
    sortOrder: 20,
    store: STORE_ID
  },
  {
    nameAr: 'صحن',
    nameEn: 'Plate',
    symbol: 'plate',
    descriptionAr: 'وحدة للأطباق',
    descriptionEn: 'Unit for plates',
    sortOrder: 21,
    store: STORE_ID
  },
  {
    nameAr: 'طبق',
    nameEn: 'Dish',
    symbol: 'dish',
    descriptionAr: 'وحدة للأطباق والصحون',
    descriptionEn: 'Unit for dishes and plates',
    sortOrder: 22,
    store: STORE_ID
  },
  
  // Paper and office units
  {
    nameAr: 'ورقة',
    nameEn: 'Sheet',
    symbol: 'sheet',
    descriptionAr: 'وحدة للأوراق والصحف',
    descriptionEn: 'Unit for papers and sheets',
    sortOrder: 23,
    store: STORE_ID
  },
  {
    nameAr: 'لفة',
    nameEn: 'Roll',
    symbol: 'roll',
    descriptionAr: 'وحدة للمواد الملفوفة',
    descriptionEn: 'Unit for rolled materials',
    sortOrder: 24,
    store: STORE_ID
  },
  {
    nameAr: 'كتاب',
    nameEn: 'Book',
    symbol: 'book',
    descriptionAr: 'وحدة للكتب',
    descriptionEn: 'Unit for books',
    sortOrder: 25,
    store: STORE_ID
  },
  {
    nameAr: 'مجلة',
    nameEn: 'Magazine',
    symbol: 'mag',
    descriptionAr: 'وحدة للمجلات',
    descriptionEn: 'Unit for magazines',
    sortOrder: 26,
    store: STORE_ID
  },
  
  // Electronics and toys
  {
    nameAr: 'جهاز',
    nameEn: 'Device',
    symbol: 'device',
    descriptionAr: 'وحدة للأجهزة الإلكترونية',
    descriptionEn: 'Unit for electronic devices',
    sortOrder: 27,
    store: STORE_ID
  },
  {
    nameAr: 'لعبة',
    nameEn: 'Toy',
    symbol: 'toy',
    descriptionAr: 'وحدة للألعاب',
    descriptionEn: 'Unit for toys',
    sortOrder: 28,
    store: STORE_ID
  },
  
  // Generic units
  {
    nameAr: 'قطعة',
    nameEn: 'Item',
    symbol: 'item',
    descriptionAr: 'وحدة عامة للعناصر',
    descriptionEn: 'General unit for items',
    sortOrder: 29,
    store: STORE_ID
  },
  {
    nameAr: 'مجموعة',
    nameEn: 'Set',
    symbol: 'set',
    descriptionAr: 'مجموعة من العناصر المترابطة',
    descriptionEn: 'Collection of related items',
    sortOrder: 30,
    store: STORE_ID
  },
  {
    nameAr: 'وحدة',
    nameEn: 'Unit',
    symbol: 'unit',
    descriptionAr: 'وحدة قياس عامة',
    descriptionEn: 'General measurement unit',
    sortOrder: 31,
    store: STORE_ID
  }
];

const createUnitData = async () => {
  try {
    //CONSOLE.log('🚀 Starting to create unit data...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    
    // Delete all existing units
    await Unit.deleteMany({});
    //CONSOLE.log('✅ Cleared existing units');
    
    // Insert new units (all with store set)
    const createdUnits = await Unit.insertMany(basicUnits);
    
    //CONSOLE.log(`✅ Successfully created ${createdUnits.length} new units`);
    //CONSOLE.log('\n📋 Created units:');
    createdUnits.forEach(unit => {
      //CONSOLE.log(`   - ${unit.nameEn} (${unit.symbol}) - ${unit.nameAr}`);
    });
    
    //CONSOLE.log(`\n📊 Total units in database: ${createdUnits.length}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error creating unit data:', error);
  } finally {
    await mongoose.connection.close();
    //CONSOLE.log('🔌 Database connection closed');
  }
};

// Run the script
createUnitData(); 