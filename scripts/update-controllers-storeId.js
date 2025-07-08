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

console.log('🔍 Checking controllers for storeId parameter support...\n');

// Check which controllers need updates
const controllersPath = path.join(__dirname, '..', 'Controllers');

controllers.forEach(controller => {
  const filePath = path.join(controllersPath, controller);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('@swagger')) {
      console.log(`✅ ${controller} - Has Swagger documentation`);
      
      if (content.includes('storeId')) {
        console.log(`   ✅ Already has storeId parameter`);
      } else {
        console.log(`   ❌ Missing storeId parameter - Needs update`);
      }
    } else {
      console.log(`⚠️  ${controller} - No Swagger documentation found`);
    }
  } else {
    console.log(`❌ ${controller} - File not found`);
  }
});

console.log('\n📋 Summary:');
console.log('Controllers with storeId parameter:');
controllersWithStoreId.forEach(controller => {
  console.log(`   ✅ ${controller}`);
});

console.log('\nControllers that need storeId parameter:');
controllers.forEach(controller => {
  const filePath = path.join(controllersPath, controller);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@swagger') && !content.includes('storeId')) {
      console.log(`   ❌ ${controller}`);
    }
  }
});

console.log('\n🎯 Next steps:');
console.log('1. Add storeId parameter to Swagger documentation for controllers that need it');
console.log('2. Update controller logic to handle storeId parameter');
console.log('3. Test all endpoints with storeId parameter');
console.log('4. Update frontend to use storeId parameter when needed'); 