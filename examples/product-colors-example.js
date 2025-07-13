const mongoose = require('mongoose');
const Product = require('../Models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '686a719956a82bfcc93a2e2d';

// Example 1: Product with single color options
const singleColorProduct = {
  nameAr: 'قميص أسود',
  nameEn: 'Black Shirt',
  descriptionAr: 'قميص أسود أنيق ومريح',
  descriptionEn: 'Elegant and comfortable black shirt',
  price: 50,
  category: '507f1f77bcf86cd799439011', // Example category ID
  store: storeId,
  unit: '507f1f77bcf86cd799439013', // Example unit ID
  availableQuantity: 10,
  stock: 10,
  colors: [
    ['#000000']  // Single black color option
  ]
};

// Example 2: Product with multiple single color options
const multiColorProduct = {
  nameAr: 'قميص بألوان متعددة',
  nameEn: 'Multi-color Shirt',
  descriptionAr: 'قميص متوفر بعدة ألوان جميلة',
  descriptionEn: 'Shirt available in multiple beautiful colors',
  price: 45,
  category: '507f1f77bcf86cd799439011', // Example category ID
  store: storeId,
  unit: '507f1f77bcf86cd799439013', // Example unit ID
  availableQuantity: 30,
  stock: 30,
  colors: [
    ['#000000'],  // Black option
    ['#FFFFFF'],  // White option
    ['#FF0000'],  // Red option
    ['#0000FF']   // Blue option
  ]
};

// Example 3: Product with mixed color options (single and multiple colors)
const mixedColorProduct = {
  nameAr: 'قميص بألوان مختلطة',
  nameEn: 'Mixed Color Shirt',
  descriptionAr: 'قميص بألوان فردية ومختلطة مميزة',
  descriptionEn: 'Shirt with unique single and mixed colors',
  price: 55,
  category: '507f1f77bcf86cd799439011', // Example category ID
  store: storeId,
  unit: '507f1f77bcf86cd799439013', // Example unit ID
  availableQuantity: 25,
  stock: 25,
  colors: [
    ['#000000'],           // Single black
    ['#FFFFFF', '#FF0000'], // White and red combination
    ['#0000FF', '#FFFF00'], // Blue and yellow combination
    ['#FF00FF']            // Single magenta
  ]
};

// Example 4: Product with RGB and RGBA colors
const rgbColorProduct = {
  nameAr: 'قميص بألوان RGB',
  nameEn: 'RGB Color Shirt',
  descriptionAr: 'قميص بألوان RGB متقدمة',
  descriptionEn: 'Shirt with advanced RGB colors',
  price: 60,
  category: '507f1f77bcf86cd799439011', // Example category ID
  store: storeId,
  unit: '507f1f77bcf86cd799439013', // Example unit ID
  availableQuantity: 15,
  stock: 15,
  colors: [
    ['rgb(255, 0, 0)'],           // Red in RGB
    ['rgba(0, 255, 0, 0.8)'],     // Green with transparency
    ['#0000FF'],                   // Blue in hex
    ['rgb(255, 255, 0)', 'rgb(255, 0, 255)'] // Yellow and magenta combination
  ]
};

// Example queries for working with colors

// Query 1: Find products with specific color
async function findProductsByColor(color) {
  return await Product.find({
    'colors': { $elemMatch: { $in: [color] } }
  });
}

// Query 2: Find products with multiple colors
async function findProductsWithMultipleColors() {
  return await Product.find({
    'colors': { $elemMatch: { $size: { $gt: 1 } } }
  });
}

// Query 3: Find products with color combinations
async function findProductsWithColorCombination(colors) {
  return await Product.find({
    'colors': { $elemMatch: { $all: colors } }
  });
}

// Query 4: Get all unique colors in the store
async function getAllUniqueColors(storeId) {
  const products = await Product.find({ store: storeId });
  const allColors = products.flatMap(product => product.allColors);
  return [...new Set(allColors)];
}

// Function to create products in database
async function createColorProducts() {
  try {
    console.log('=== Creating Color Products in Database ===\n');
    
    // Clear existing test products for this store
    await Product.deleteMany({ 
      store: storeId,
      nameEn: { $in: ['Black Shirt', 'Multi-color Shirt', 'Mixed Color Shirt', 'RGB Color Shirt'] }
    });
    console.log('✅ Cleared existing test products');
    
    // Create all products
    const products = [
      singleColorProduct,
      multiColorProduct,
      mixedColorProduct,
      rgbColorProduct
    ];
    
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Successfully created ${createdProducts.length} products`);
    
    // Display created products
    createdProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.nameEn} (${product.nameAr}):`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Colors: ${product.colorOptionsCount} options`);
      console.log(`   All Colors: ${product.allColors.join(', ')}`);
      console.log(`   ID: ${product._id}`);
    });
    
    console.log('\n=== Product Creation Summary ===');
    console.log(`✅ Store ID: ${storeId}`);
    console.log(`✅ Total Products: ${createdProducts.length}`);
    console.log(`✅ All products have colors and virtual properties working`);
    
    return createdProducts;
    
  } catch (error) {
    console.error('❌ Error creating products:', error);
    throw error;
  }
}

// Example usage functions
async function demonstrateColorSystem() {
  console.log('=== Product Colors System Examples ===\n');
  
  // Example of creating a product with colors
  console.log('1. Single Color Product:');
  console.log(JSON.stringify(singleColorProduct, null, 2));
  
  console.log('\n2. Multi-Color Product:');
  console.log(JSON.stringify(multiColorProduct, null, 2));
  
  console.log('\n3. Mixed Color Product:');
  console.log(JSON.stringify(mixedColorProduct, null, 2));
  
  console.log('\n4. RGB Color Product:');
  console.log(JSON.stringify(rgbColorProduct, null, 2));
  
  console.log('\n=== Color Query Examples ===');
  console.log('• Find products with black color: findProductsByColor("#000000")');
  console.log('• Find products with multiple colors: findProductsWithMultipleColors()');
  console.log('• Find products with white+red: findProductsWithColorCombination(["#FFFFFF", "#FF0000"])');
  console.log('• Get all unique colors: getAllUniqueColors(storeId)');
  
  console.log('\n=== Virtual Properties ===');
  console.log('• product.allColors - Returns all unique colors');
  console.log('• product.colorOptionsCount - Returns number of color options');
}

// Export examples
module.exports = {
  singleColorProduct,
  multiColorProduct,
  mixedColorProduct,
  rgbColorProduct,
  findProductsByColor,
  findProductsWithMultipleColors,
  findProductsWithColorCombination,
  getAllUniqueColors,
  demonstrateColorSystem,
  createColorProducts
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  createColorProducts()
    .then(() => {
      console.log('\n✅ Product creation completed successfully!');
      mongoose.connection.close();
      console.log('Database connection closed.');
    })
    .catch((error) => {
      console.error('❌ Failed to create products:', error);
      mongoose.connection.close();
      process.exit(1);
    });
} 13/7