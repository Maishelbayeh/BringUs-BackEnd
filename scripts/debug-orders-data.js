const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Debug orders data
async function debugOrdersData() {
  try {
    await connectDB();
    
    const Order = require('../Models/Order');
    
    console.log('🔍 Debugging Orders Data\n');
    
    // Get total orders count
    const totalOrders = await Order.countDocuments();
    console.log(`📊 Total Orders in Database: ${totalOrders}`);
    
    if (totalOrders === 0) {
      console.log('❌ No orders found in database');
      return;
    }
    
    // Get sample order
    const sampleOrder = await Order.findOne().populate('store', 'nameEn nameAr');
    console.log('\n📦 Sample Order Structure:');
    console.log(`   Order ID: ${sampleOrder._id}`);
    console.log(`   Store: ${sampleOrder.store?.nameEn || 'No store'}`);
    console.log(`   Items Count: ${sampleOrder.items?.length || 0}`);
    
    if (sampleOrder.items && sampleOrder.items.length > 0) {
      console.log('\n🛍️ Sample Item Structure:');
      const sampleItem = sampleOrder.items[0];
      console.log(`   Product ID: ${sampleItem.productId}`);
      console.log(`   Product Name: ${sampleItem.productSnapshot?.nameEn || 'No name'}`);
      console.log(`   SKU: ${sampleItem.sku}`);
      console.log(`   Quantity: ${sampleItem.quantity}`);
      console.log(`   Price: ${sampleItem.price}`);
      console.log(`   Categories: ${sampleItem.productSnapshot?.categories?.length || 0}`);
      
      if (sampleItem.productSnapshot?.categories && sampleItem.productSnapshot.categories.length > 0) {
        console.log('   Category Details:');
        sampleItem.productSnapshot.categories.forEach((cat, index) => {
          console.log(`     ${index + 1}. ${cat.nameEn} (${cat.nameAr})`);
        });
      }
    }
    
    // Check for orders with specific store
    const ordersWithStore = await Order.find({ 'store.id': { $exists: true } }).limit(5);
    console.log(`\n🏪 Orders with Store ID: ${ordersWithStore.length}`);
    
    if (ordersWithStore.length > 0) {
      console.log('   Store IDs found:');
      ordersWithStore.forEach(order => {
        console.log(`     - ${order.store?.id || order.store?._id}`);
      });
    }
    
    // Check for orders with items
    const ordersWithItems = await Order.find({ 'items.0': { $exists: true } }).limit(5);
    console.log(`\n🛒 Orders with Items: ${ordersWithItems.length}`);
    
    // Check for orders with product snapshots
    const ordersWithSnapshots = await Order.find({ 'items.productSnapshot': { $exists: true } }).limit(5);
    console.log(`📸 Orders with Product Snapshots: ${ordersWithSnapshots.length}`);
    
    // Check for orders with categories in snapshots
    const ordersWithCategories = await Order.find({ 
      'items.productSnapshot.categories': { $exists: true, $ne: [] } 
    }).limit(5);
    console.log(`📂 Orders with Categories: ${ordersWithCategories.length}`);
    
    console.log('\n✅ Debug Complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugOrdersData();
