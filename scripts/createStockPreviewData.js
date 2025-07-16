const mongoose = require('mongoose');
const StockPreview = require('../Models/StockPreview');
const Product = require('../Models/Product');
const Store = require('../Models/Store');
const User = require('../Models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', //CONSOLE.error.bind(//CONSOLE, 'MongoDB connection error:'));
db.once('open', async () => {
  //CONSOLE.log('Connected to MongoDB');
  
  try {
    // Clear existing stock preview data
    await StockPreview.deleteMany({});
    //CONSOLE.log('Cleared existing stock preview data');
    
    // Get stores
    const stores = await Store.find({});
    if (stores.length === 0) {
      //CONSOLE.log('No stores found. Please create stores first.');
      process.exit(1);
    }
    
    // Get products for each store
    const products = await Product.find({});
    if (products.length === 0) {
      //CONSOLE.log('No products found. Please create products first.');
      process.exit(1);
    }
    
    // Get admin users for movement tracking
    const adminUsers = await User.find({ role: 'admin' });
    const adminUser = adminUsers.length > 0 ? adminUsers[0]._id : null;
    
    //CONSOLE.log(`Found ${stores.length} stores and ${products.length} products`);
    
    // Create stock preview data for each store
    for (const store of stores) {
      //CONSOLE.log(`\nCreating stock preview data for store: ${store.name}`);
      
      // Get products for this store
      const storeProducts = products.filter(p => p.store.toString() === store._id.toString());
      
      if (storeProducts.length === 0) {
        //CONSOLE.log(`No products found for store: ${store.name}`);
        continue;
      }
      
      const stockPreviewData = [];
      
      // Create stock preview for each product
      for (const product of storeProducts) {
        // Generate realistic stock data based on product type
        const stockData = generateStockData(product, store.name);
        
        // Create stock movements history
        const stockMovements = generateStockMovements(stockData, adminUser);
        
        // Create stock alerts
        const alerts = generateStockAlerts(stockData);
        
        const stockPreview = {
          product: product._id,
          store: store._id,
          availableQuantity: stockData.availableQuantity,
          reservedQuantity: stockData.reservedQuantity,
          soldQuantity: stockData.soldQuantity,
          damagedQuantity: stockData.damagedQuantity,
          lowStockThreshold: stockData.lowStockThreshold,
          outOfStockThreshold: stockData.outOfStockThreshold,
          stockStatus: stockData.stockStatus,
          isVisible: stockData.isVisible,
          stockMovements: stockMovements,
          alerts: alerts,
          lastStockUpdate: new Date()
        };
        
        stockPreviewData.push(stockPreview);
      }
      
      // Insert stock preview data
      const createdStock = await StockPreview.insertMany(stockPreviewData);
      //CONSOLE.log(`Created ${createdStock.length} stock preview records for ${store.name}`);
    }
    
    // Display summary
    const totalStock = await StockPreview.countDocuments();
    const summary = await StockPreview.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalAvailableQuantity: { $sum: '$availableQuantity' },
          totalReservedQuantity: { $sum: '$reservedQuantity' },
          totalSoldQuantity: { $sum: '$soldQuantity' },
          totalDamagedQuantity: { $sum: '$damagedQuantity' },
          inStockProducts: {
            $sum: { $cond: [{ $eq: ['$stockStatus', 'in_stock'] }, 1, 0] }
          },
          lowStockProducts: {
            $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0] }
          },
          visibleProducts: {
            $sum: { $cond: ['$isVisible', 1, 0] }
          }
        }
      }
    ]);
    
    //CONSOLE.log('\n=== Stock Preview Data Creation Summary ===');
    //CONSOLE.log(`Total stock records created: ${totalStock}`);
    
    if (summary.length > 0) {
      const stats = summary[0];
      //CONSOLE.log(`Total products: ${stats.totalProducts}`);
      //CONSOLE.log(`Total available quantity: ${stats.totalAvailableQuantity}`);
      //CONSOLE.log(`Total reserved quantity: ${stats.totalReservedQuantity}`);
      //CONSOLE.log(`Total sold quantity: ${stats.totalSoldQuantity}`);
      //CONSOLE.log(`Total damaged quantity: ${stats.totalDamagedQuantity}`);
      //CONSOLE.log(`In stock products: ${stats.inStockProducts}`);
      //CONSOLE.log(`Low stock products: ${stats.lowStockProducts}`);
      //CONSOLE.log(`Out of stock products: ${stats.outOfStockProducts}`);
      //CONSOLE.log(`Visible products: ${stats.visibleProducts}`);
    }
    
    // Show sample data
    //CONSOLE.log('\n=== Sample Stock Preview Data ===');
    const sampleStock = await StockPreview.findOne()
      .populate('product', 'nameAr nameEn category price')
      .populate('store', 'name domain');
    
    if (sampleStock) {
      //CONSOLE.log('Sample Stock Record:');
      //CONSOLE.log(`Product: ${sampleStock.product.nameAr} (${sampleStock.product.nameEn})`);
      //CONSOLE.log(`Store: ${sampleStock.store.name}`);
      //CONSOLE.log(`Available: ${sampleStock.availableQuantity}`);
      //CONSOLE.log(`Reserved: ${sampleStock.reservedQuantity}`);
      //CONSOLE.log(`Sold: ${sampleStock.soldQuantity}`);
      //CONSOLE.log(`Damaged: ${sampleStock.damagedQuantity}`);
      //CONSOLE.log(`Status: ${sampleStock.stockStatus}`);
      //CONSOLE.log(`Visible: ${sampleStock.isVisible}`);
      //CONSOLE.log(`Total Quantity: ${sampleStock.totalQuantity}`);
      //CONSOLE.log(`Stock Percentage: ${sampleStock.stockPercentage}%`);
      //CONSOLE.log(`Is Low Stock: ${sampleStock.isLowStock}`);
      //CONSOLE.log(`Is Out of Stock: ${sampleStock.isOutOfStock}`);
    }
    
    //CONSOLE.log('\n✅ Stock preview data created successfully!');
    //CONSOLE.log('\n📋 Next Steps:');
    //CONSOLE.log('1. Test the API endpoints using the CURL commands');
    //CONSOLE.log('2. Check stock summary and analytics');
    //CONSOLE.log('3. Test stock movement tracking');
    //CONSOLE.log('4. Verify store isolation');
    
  } catch (error) {
    //CONSOLE.error('Error creating stock preview data:', error);
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('MongoDB connection closed');
  }
});

// Generate realistic stock data based on product and store
function generateStockData(product, storeName) {
  const isTechStore = storeName.toLowerCase().includes('tech');
  const isFashionStore = storeName.toLowerCase().includes('fashion');
  
  let availableQuantity, soldQuantity, lowStockThreshold, outOfStockThreshold;
  let stockStatus, isVisible;
  
  // Generate quantities based on product type and store
  if (isTechStore) {
    // Tech products typically have lower quantities but higher prices
    availableQuantity = Math.floor(Math.random() * 200) + 10;
    soldQuantity = Math.floor(Math.random() * 500) + 50;
    lowStockThreshold = Math.floor(Math.random() * 20) + 5;
    outOfStockThreshold = 0;
  } else if (isFashionStore) {
    // Fashion products have higher quantities but lower prices
    availableQuantity = Math.floor(Math.random() * 500) + 50;
    soldQuantity = Math.floor(Math.random() * 1000) + 100;
    lowStockThreshold = Math.floor(Math.random() * 30) + 10;
    outOfStockThreshold = 0;
  } else {
    // General products
    availableQuantity = Math.floor(Math.random() * 300) + 20;
    soldQuantity = Math.floor(Math.random() * 800) + 80;
    lowStockThreshold = Math.floor(Math.random() * 25) + 8;
    outOfStockThreshold = 0;
  }
  
  // Generate reserved and damaged quantities
  const reservedQuantity = Math.floor(Math.random() * Math.min(availableQuantity * 0.1, 10));
  const damagedQuantity = Math.floor(Math.random() * Math.min(availableQuantity * 0.05, 5));
  
  // Determine stock status
  if (availableQuantity <= outOfStockThreshold) {
    stockStatus = 'out_of_stock';
  } else if (availableQuantity <= lowStockThreshold) {
    stockStatus = 'low_stock';
  } else {
    stockStatus = 'in_stock';
  }
  
  // Determine visibility (most products are visible)
  isVisible = Math.random() > 0.1; // 90% chance of being visible
  
  return {
    availableQuantity,
    reservedQuantity,
    soldQuantity,
    damagedQuantity,
    lowStockThreshold,
    outOfStockThreshold,
    stockStatus,
    isVisible
  };
}

// Generate stock movements history
function generateStockMovements(stockData, adminUser) {
  const movements = [];
  const movementTypes = ['purchase', 'sale', 'return', 'damage', 'adjustment'];
  const reasons = [
    'Initial stock setup',
    'Regular purchase from supplier',
    'Customer order fulfillment',
    'Customer return - defective',
    'Customer return - change of mind',
    'Damaged during shipping',
    'Inventory adjustment',
    'Stock count correction',
    'Promotional sale',
    'Bulk order fulfillment'
  ];
  
  const references = [
    'INIT-2024-001',
    'PO-2024-001',
    'ORDER-2024-001',
    'RETURN-2024-001',
    'DAMAGE-2024-001',
    'ADJUST-2024-001',
    'COUNT-2024-001',
    'PROMO-2024-001',
    'BULK-2024-001'
  ];
  
  // Generate 3-8 movements per product
  const numMovements = Math.floor(Math.random() * 6) + 3;
  
  for (let i = 0; i < numMovements; i++) {
    const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    const reference = references[Math.floor(Math.random() * references.length)];
    
    // Generate realistic quantities based on movement type
    let quantity, previousQuantity, newQuantity;
    
    switch (movementType) {
      case 'purchase':
        quantity = Math.floor(Math.random() * 100) + 10;
        previousQuantity = stockData.availableQuantity - quantity;
        newQuantity = stockData.availableQuantity;
        break;
      case 'sale':
        quantity = Math.floor(Math.random() * Math.min(stockData.availableQuantity * 0.3, 20)) + 1;
        previousQuantity = stockData.availableQuantity + quantity;
        newQuantity = stockData.availableQuantity;
        break;
      case 'return':
        quantity = Math.floor(Math.random() * 5) + 1;
        previousQuantity = stockData.availableQuantity - quantity;
        newQuantity = stockData.availableQuantity;
        break;
      case 'damage':
        quantity = Math.floor(Math.random() * 3) + 1;
        previousQuantity = stockData.availableQuantity + quantity;
        newQuantity = stockData.availableQuantity;
        break;
      case 'adjustment':
        quantity = Math.floor(Math.random() * 10) - 5; // Can be positive or negative
        previousQuantity = stockData.availableQuantity - quantity;
        newQuantity = stockData.availableQuantity;
        break;
    }
    
    movements.push({
      type: movementType,
      quantity: Math.abs(quantity),
      previousQuantity: Math.max(0, previousQuantity),
      newQuantity: Math.max(0, newQuantity),
      reason: reason,
      reference: reference,
      performedBy: adminUser,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    });
  }
  
  // Sort movements by timestamp
  movements.sort((a, b) => a.timestamp - b.timestamp);
  
  return movements;
}

// Generate stock alerts
function generateStockAlerts(stockData) {
  const alerts = [];
  
  // Generate low stock alert if applicable
  if (stockData.stockStatus === 'low_stock') {
    alerts.push({
      type: 'low_stock',
      message: `Product is running low on stock. Current quantity: ${stockData.availableQuantity}`,
      severity: 'medium',
      isRead: Math.random() > 0.5, // 50% chance of being read
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
    });
  }
  
  // Generate out of stock alert if applicable
  if (stockData.stockStatus === 'out_of_stock') {
    alerts.push({
      type: 'out_of_stock',
      message: 'Product is out of stock. Please restock immediately.',
      severity: 'high',
      isRead: Math.random() > 0.3, // 30% chance of being read
      createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) // Random date within last 3 days
    });
  }
  
  // Generate overstock alert if quantity is very high
  if (stockData.availableQuantity > stockData.lowStockThreshold * 10) {
    alerts.push({
      type: 'overstock',
      message: `Product has high stock levels. Consider promotional activities. Current quantity: ${stockData.availableQuantity}`,
      severity: 'low',
      isRead: Math.random() > 0.7, // 70% chance of being read
      createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random date within last 14 days
    });
  }
  
  return alerts;
} 