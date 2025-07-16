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

const basicUnits = [
  // Basic measurement units
  {
    nameAr: 'قطعة',
    nameEn: 'Piece',
    symbol: 'pc',
    descriptionAr: 'وحدة قياس أساسية للقطع الفردية',
    descriptionEn: 'Basic unit for individual pieces',
    sortOrder: 1
  },
  {
    nameAr: 'كيلوغرام',
    nameEn: 'Kilogram',
    symbol: 'kg',
    descriptionAr: 'وحدة قياس الوزن الأساسية',
    descriptionEn: 'Basic unit of weight measurement',
    sortOrder: 2
  },
  {
    nameAr: 'لتر',
    nameEn: 'Liter',
    symbol: 'L',
    descriptionAr: 'وحدة قياس الحجم للسوائل',
    descriptionEn: 'Volume measurement unit for liquids',
    sortOrder: 3
  },
  {
    nameAr: 'متر',
    nameEn: 'Meter',
    symbol: 'm',
    descriptionAr: 'وحدة قياس الطول الأساسية',
    descriptionEn: 'Basic unit of length measurement',
    sortOrder: 4
  },
  {
    nameAr: 'غرام',
    nameEn: 'Gram',
    symbol: 'g',
    descriptionAr: 'وحدة قياس الوزن الصغيرة',
    descriptionEn: 'Small unit of weight measurement',
    sortOrder: 5
  },
  {
    nameAr: 'سنتيمتر',
    nameEn: 'Centimeter',
    symbol: 'cm',
    descriptionAr: 'وحدة قياس الطول الصغيرة',
    descriptionEn: 'Small unit of length measurement',
    sortOrder: 6
  },
  {
    nameAr: 'مليمتر',
    nameEn: 'Millimeter',
    symbol: 'mm',
    descriptionAr: 'وحدة قياس الطول الدقيقة',
    descriptionEn: 'Precise unit of length measurement',
    sortOrder: 7
  },
  {
    nameAr: 'متر مربع',
    nameEn: 'Square Meter',
    symbol: 'm²',
    descriptionAr: 'وحدة قياس المساحة',
    descriptionEn: 'Unit of area measurement',
    sortOrder: 8
  },
  {
    nameAr: 'متر مكعب',
    nameEn: 'Cubic Meter',
    symbol: 'm³',
    descriptionAr: 'وحدة قياس الحجم',
    descriptionEn: 'Unit of volume measurement',
    sortOrder: 9
  },
  {
    nameAr: 'ميللي لتر',
    nameEn: 'Milliliter',
    symbol: 'ml',
    descriptionAr: 'وحدة قياس الحجم الصغيرة',
    descriptionEn: 'Small unit of volume measurement',
    sortOrder: 10
  },
  
  // Clothing and fashion units
  {
    nameAr: 'زوج',
    nameEn: 'Pair',
    symbol: 'pair',
    descriptionAr: 'وحدة للجوارب والأحذية والقفازات',
    descriptionEn: 'Unit for socks, shoes, and gloves',
    sortOrder: 11
  },
  {
    nameAr: 'قطعة ملابس',
    nameEn: 'Garment',
    symbol: 'garment',
    descriptionAr: 'وحدة للملابس الفردية',
    descriptionEn: 'Unit for individual clothing items',
    sortOrder: 12
  },
  {
    nameAr: 'طقم',
    nameEn: 'Set',
    symbol: 'set',
    descriptionAr: 'مجموعة من الملابس المتناسقة',
    descriptionEn: 'Coordinated set of clothing',
    sortOrder: 13
  },
  
  // Packaging units
  {
    nameAr: 'علبة',
    nameEn: 'Box',
    symbol: 'box',
    descriptionAr: 'وحدة التعبئة في علب',
    descriptionEn: 'Packaging unit in boxes',
    sortOrder: 14
  },
  {
    nameAr: 'عبوة',
    nameEn: 'Pack',
    symbol: 'pack',
    descriptionAr: 'وحدة التعبئة في عبوات',
    descriptionEn: 'Packaging unit in packs',
    sortOrder: 15
  },
  {
    nameAr: 'زجاجة',
    nameEn: 'Bottle',
    symbol: 'bottle',
    descriptionAr: 'وحدة التعبئة في زجاجات',
    descriptionEn: 'Packaging unit in bottles',
    sortOrder: 16
  },
  {
    nameAr: 'كيس',
    nameEn: 'Bag',
    symbol: 'bag',
    descriptionAr: 'وحدة التعبئة في أكياس',
    descriptionEn: 'Packaging unit in bags',
    sortOrder: 17
  },
  {
    nameAr: 'حزمة',
    nameEn: 'Bundle',
    symbol: 'bundle',
    descriptionAr: 'مجموعة من العناصر المربوطة معاً',
    descriptionEn: 'Group of items tied together',
    sortOrder: 18
  },
  
  // Kitchen and household units
  {
    nameAr: 'كوب',
    nameEn: 'Cup',
    symbol: 'cup',
    descriptionAr: 'وحدة قياس المطبخ',
    descriptionEn: 'Kitchen measurement unit',
    sortOrder: 19
  },
  {
    nameAr: 'ملعقة',
    nameEn: 'Spoon',
    symbol: 'spoon',
    descriptionAr: 'وحدة قياس المطبخ الصغيرة',
    descriptionEn: 'Small kitchen measurement unit',
    sortOrder: 20
  },
  {
    nameAr: 'صحن',
    nameEn: 'Plate',
    symbol: 'plate',
    descriptionAr: 'وحدة للأطباق',
    descriptionEn: 'Unit for plates',
    sortOrder: 21
  },
  {
    nameAr: 'طبق',
    nameEn: 'Dish',
    symbol: 'dish',
    descriptionAr: 'وحدة للأطباق والصحون',
    descriptionEn: 'Unit for dishes and plates',
    sortOrder: 22
  },
  
  // Paper and office units
  {
    nameAr: 'ورقة',
    nameEn: 'Sheet',
    symbol: 'sheet',
    descriptionAr: 'وحدة للأوراق والصحف',
    descriptionEn: 'Unit for papers and sheets',
    sortOrder: 23
  },
  {
    nameAr: 'لفة',
    nameEn: 'Roll',
    symbol: 'roll',
    descriptionAr: 'وحدة للمواد الملفوفة',
    descriptionEn: 'Unit for rolled materials',
    sortOrder: 24
  },
  {
    nameAr: 'كتاب',
    nameEn: 'Book',
    symbol: 'book',
    descriptionAr: 'وحدة للكتب',
    descriptionEn: 'Unit for books',
    sortOrder: 25
  },
  {
    nameAr: 'مجلة',
    nameEn: 'Magazine',
    symbol: 'mag',
    descriptionAr: 'وحدة للمجلات',
    descriptionEn: 'Unit for magazines',
    sortOrder: 26
  },
  
  // Electronics and toys
  {
    nameAr: 'جهاز',
    nameEn: 'Device',
    symbol: 'device',
    descriptionAr: 'وحدة للأجهزة الإلكترونية',
    descriptionEn: 'Unit for electronic devices',
    sortOrder: 27
  },
  {
    nameAr: 'لعبة',
    nameEn: 'Toy',
    symbol: 'toy',
    descriptionAr: 'وحدة للألعاب',
    descriptionEn: 'Unit for toys',
    sortOrder: 28
  },
  
  // Generic units
  {
    nameAr: 'قطعة',
    nameEn: 'Item',
    symbol: 'item',
    descriptionAr: 'وحدة عامة للعناصر',
    descriptionEn: 'General unit for items',
    sortOrder: 29
  },
  {
    nameAr: 'مجموعة',
    nameEn: 'Set',
    symbol: 'set',
    descriptionAr: 'مجموعة من العناصر المترابطة',
    descriptionEn: 'Collection of related items',
    sortOrder: 30
  },
  {
    nameAr: 'وحدة',
    nameEn: 'Unit',
    symbol: 'unit',
    descriptionAr: 'وحدة قياس عامة',
    descriptionEn: 'General measurement unit',
    sortOrder: 31
  }
];

const createUnitData = async () => {
  try {
    //CONSOLE.log('🚀 Starting to create unit data...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    
    // Check for existing units to avoid duplicates
    const existingUnits = await Unit.find({});
    const existingSymbols = existingUnits.map(unit => unit.symbol);
    
    // Uncomment the next line if you want to clear all existing units first
    // await Unit.deleteMany({});
    // //CONSOLE.log('✅ Cleared existing units');
    
    // Filter out units that already exist
    const newUnits = basicUnits.filter(unit => !existingSymbols.includes(unit.symbol));
    
    if (newUnits.length === 0) {
      //CONSOLE.log('ℹ️  All units already exist in the database');
      //CONSOLE.log('💡 To add all units again, uncomment the clear line in the script');
      return;
    }
    
    // Insert new units
    const createdUnits = await Unit.insertMany(newUnits);
    
    //CONSOLE.log(`✅ Successfully created ${createdUnits.length} new units`);
    //CONSOLE.log('\n📋 Created units:');
    createdUnits.forEach(unit => {
      //CONSOLE.log(`   - ${unit.nameEn} (${unit.symbol}) - ${unit.nameAr}`);
    });
    
    //CONSOLE.log(`\n📊 Total units in database: ${existingUnits.length + createdUnits.length}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error creating unit data:', error);
  } finally {
    await mongoose.connection.close();
    //CONSOLE.log('🔌 Database connection closed');
  }
};

// Run the script
createUnitData(); 