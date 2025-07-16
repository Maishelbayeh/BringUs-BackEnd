const fs = require('fs');
const path = require('path');

// List of controllers that need storeId parameter
const controllers = [
  'PaymentMethodController.js',
  'ProductController.js',
  'CategoryController.js',
  'UnitController.js',
  'ProductVariantController.js',
  'ProductSpecificationController.js',
  'ProductLabelController.js'
];

// Controllers that already have storeId parameter
const controllersWithStoreId = [
  'DeliveryMethodController.js',
  'AdvertisementController.js',
  'StoreSliderController.js',
  'StockPreviewController.js',
  'AffiliationController.js'
];

//CONSOLE.log('🔍 Checking controllers for storeId parameter support...\n');

// Check which controllers need updates
const controllersPath = path.join(__dirname, '..', 'Controllers');

controllers.forEach(controller => {
  const filePath = path.join(controllersPath, controller);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('@swagger')) {
      //CONSOLE.log(`✅ ${controller} - Has Swagger documentation`);
      
      if (content.includes('storeId')) {
        //CONSOLE.log(`   ✅ Already has storeId parameter`);
      } else {
        //CONSOLE.log(`   ❌ Missing storeId parameter - Needs update`);
      }
    } else {
      //CONSOLE.log(`⚠️  ${controller} - No Swagger documentation found`);
    }
  } else {
    //CONSOLE.log(`❌ ${controller} - File not found`);
  }
});

//CONSOLE.log('\n📋 Summary:');
//CONSOLE.log('Controllers with storeId parameter:');
controllersWithStoreId.forEach(controller => {
  //CONSOLE.log(`   ✅ ${controller}`);
});

//CONSOLE.log('\nControllers that need storeId parameter:');
controllers.forEach(controller => {
  const filePath = path.join(controllersPath, controller);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@swagger') && !content.includes('storeId')) {
      //CONSOLE.log(`   ❌ ${controller}`);
    }
  }
});

//CONSOLE.log('\n🎯 Next steps:');
//CONSOLE.log('1. Add storeId parameter to Swagger documentation for controllers that need it');
//CONSOLE.log('2. Update controller logic to handle storeId parameter');
//CONSOLE.log('3. Test all endpoints with storeId parameter');
//CONSOLE.log('4. Update frontend to use storeId parameter when needed'); 