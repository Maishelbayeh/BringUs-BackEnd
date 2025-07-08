const mongoose = require('mongoose');
const Wholesaler = require('../Models/Wholesaler');
const Store = require('../Models/Store');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing wholesaler data
    await Wholesaler.deleteMany({});
    console.log('Cleared existing wholesaler data');
    
    // Get stores
    const stores = await Store.find({});
    if (stores.length === 0) {
      console.log('No stores found. Please create stores first.');
      process.exit(1);
    }
    
    // Get admin users for verification
    const adminUsers = await User.find({ role: 'admin' });
    let adminUser = adminUsers.length > 0 ? adminUsers[0]._id : null;
    
    // If no admin user found, try to find any user or create a fallback
    if (!adminUser) {
      const anyUser = await User.findOne();
      if (anyUser) {
        adminUser = anyUser._id;
        console.log('Using fallback user for admin operations:', anyUser.email);
      } else {
        console.log('Warning: No users found. Verification may fail.');
      }
    }
    
    console.log(`Found ${stores.length} stores`);
    
    // Create wholesaler data for each store
    for (const store of stores) {
      console.log(`\nCreating wholesaler data for store: ${store.name}`);
      
      const wholesalerData = [];
      
      // Generate realistic wholesaler data based on store type
      const wholesalers = generateWholesalers(store.name, store._id, adminUser);
      
      for (const wholesaler of wholesalers) {
        // Create wholesaler
        const createdWholesaler = await Wholesaler.create(wholesaler);
        wholesalerData.push(createdWholesaler);
        
        console.log(`Created wholesaler: ${createdWholesaler.firstName} ${createdWholesaler.lastName} (${createdWholesaler.email})`);
      }
      
      console.log(`Created ${wholesalerData.length} wholesalers for ${store.name}`);
    }
    
    // Display summary
    const totalWholesalers = await Wholesaler.countDocuments();
    
    const stats = await Wholesaler.aggregate([
      {
        $group: {
          _id: null,
          totalWholesalers: { $sum: 1 },
          activeWholesalers: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          averageDiscount: { $avg: '$discount' },
          verifiedWholesalers: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          }
        }
      }
    ]);
    
    console.log('\n=== Wholesaler Data Creation Summary ===');
    console.log(`Total wholesalers created: ${totalWholesalers}`);
    
    if (stats.length > 0) {
      const wholesalerStats = stats[0];
      console.log('\nWholesaler Statistics:');
      console.log(`Total wholesalers: ${wholesalerStats.totalWholesalers}`);
      console.log(`Active wholesalers: ${wholesalerStats.activeWholesalers}`);
      console.log(`Average discount: ${wholesalerStats.averageDiscount.toFixed(1)}%`);
      console.log(`Verified wholesalers: ${wholesalerStats.verifiedWholesalers}`);
    }
    
    // Show sample data
    console.log('\n=== Sample Wholesaler Data ===');
    const sampleWholesaler = await Wholesaler.findOne()
      .populate('store', 'name domain')
      .populate('verifiedBy', 'firstName lastName');
    
    if (sampleWholesaler) {
      console.log('Sample Wholesaler:');
      console.log(`Name: ${sampleWholesaler.fullName}`);
      console.log(`Email: ${sampleWholesaler.email}`);
      console.log(`Store: ${sampleWholesaler.store.name}`);
      console.log(`Discount: ${sampleWholesaler.discountRate}`);
      console.log(`Status: ${sampleWholesaler.status}`);
      console.log(`Is Verified: ${sampleWholesaler.isVerified}`);
      console.log(`Business Name: ${sampleWholesaler.businessName || 'N/A'}`);
      console.log(`Address: ${sampleWholesaler.address}`);
    }
    
    console.log('\n✅ Wholesaler data created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the API endpoints using the CURL commands');
    console.log('2. Check wholesaler statistics and analytics');
    console.log('3. Test wholesaler verification flow');
    console.log('4. Verify store isolation');
    console.log('5. Test discount calculations');
    
  } catch (error) {
    console.error('Error creating wholesaler data:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
});

// Generate realistic wholesaler data based on store type
function generateWholesalers(storeName, storeId, adminUser) {
  const isTechStore = storeName.toLowerCase().includes('tech');
  const isFashionStore = storeName.toLowerCase().includes('fashion');
  
  const wholesalers = [];
  const numWholesalers = Math.floor(Math.random() * 6) + 2; // 2-7 wholesalers per store
  
  const firstNames = ['أحمد', 'محمد', 'علي', 'فاطمة', 'سارة', 'ليلى', 'يوسف', 'نور', 'خالد', 'عمر'];
  const lastNames = ['محمد', 'حسن', 'علي', 'أحمد', 'خالد', 'عمر', 'فاطمة', 'سارة', 'ليلى', 'نور'];
  const cities = ['الخليل', 'جنين', 'نابلس', 'رام الله', 'بيت لحم', 'طولكرم', 'قلقيلية', 'سلفيت', 'طوباس', 'أريحا'];
  const businessNames = [
    'شركة التجارة العامة',
    'مؤسسة البيع بالجملة',
    'شركة التوزيع الحديثة',
    'مؤسسة التجارة الدولية',
    'شركة البيع المباشر',
    'مؤسسة التوزيع السريع',
    'شركة التجارة الإلكترونية',
    'مؤسسة البيع المتخصصة'
  ];
  
  for (let i = 0; i < numWholesalers; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const businessName = businessNames[Math.floor(Math.random() * businessNames.length)];
    
    // Generate discount based on store type
    let discount;
    if (isTechStore) {
      discount = Math.floor(Math.random() * 15) + 10; // 10-24% for tech
    } else if (isFashionStore) {
      discount = Math.floor(Math.random() * 20) + 15; // 15-34% for fashion
    } else {
      discount = Math.floor(Math.random() * 12) + 8; // 8-19% for general
    }
    
    // Determine status
    const statusOptions = ['Active', 'Active', 'Active', 'Pending', 'Inactive'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Determine if verified
    const isVerified = status === 'Active' && Math.random() > 0.3; // 70% of active wholesalers are verified
    
    const wholesaler = {
      store: storeId,
      firstName,
      lastName,
      email: `wholesaler${storeId.slice(-6)}${i + 1}@example.com`,
      password: 'password123', // Will be hashed by the model
      mobile: `+970${Math.floor(Math.random() * 90000000) + 10000000}`,
      address: `${city}، فلسطين`,
      discount,
      status,
      businessName: `${businessName} - ${city}`,
      businessLicense: `LIC-${Math.floor(Math.random() * 900000) + 100000}`,
      taxNumber: `TAX-${Math.floor(Math.random() * 900000) + 100000}`,
      contactPerson: `${firstName} ${lastName}`,
      phone: `+970${Math.floor(Math.random() * 90000000) + 10000000}`,
      // Optional fields - only add if needed
      ...(Math.random() > 0.3 && {
        bankInfo: {
          bankName: 'بنك فلسطين',
          accountNumber: Math.floor(Math.random() * 9000000000) + 1000000000,
          iban: `PS12PALS${Math.floor(Math.random() * 90000000000000000000000000) + 10000000000000000000000000}`,
          swiftCode: 'PALSPS22'
        }
      }),
      ...(Math.random() > 0.2 && {
        settings: {
          autoApproval: Math.random() > 0.7, // 30% have auto approval
          creditLimit: Math.floor(Math.random() * 50000) + 5000,
          paymentTerms: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
          notifications: {
            email: true,
            sms: Math.random() > 0.5
          }
        }
      }),
      notes: `تاجر جملة من ${city}، متخصص في ${isTechStore ? 'المنتجات التقنية' : isFashionStore ? 'المنتجات الأزياء' : 'المنتجات العامة'}`,
      isVerified,
      verificationDate: isVerified ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      verifiedBy: isVerified ? adminUser : null,
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    };
    
    wholesalers.push(wholesaler);
  }
  
  return wholesalers;
}

// Main execution
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0');
    
    // Create wholesaler data for specific store
    const storeId = '686a719956a82bfcc93a2e2d';
    
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error('Store not found with ID:', storeId);
      return;
    }
    
    console.log('Creating wholesalers for store:', store.name);
    
    // Check if wholesalers already exist for this store
    const existingWholesalers = await Wholesaler.find({ store: storeId });
    if (existingWholesalers.length > 0) {
      console.log(`Found ${existingWholesalers.length} existing wholesalers for this store`);
      console.log('Skipping creation to avoid duplicates');
      return;
    }
    
    // Get admin user
    const adminUsers = await User.find({ role: 'admin' });
    let adminUser = adminUsers.length > 0 ? adminUsers[0]._id : null;
    
    if (!adminUser) {
      const anyUser = await User.findOne();
      if (anyUser) {
        adminUser = anyUser._id;
        console.log('Using fallback user for admin operations:', anyUser.email);
      }
    }
    
    // Generate wholesalers
    const wholesalers = generateWholesalers(store.name, storeId, adminUser);
    
    // Create wholesalers
    const createdWholesalers = [];
    
    for (const wholesalerData of wholesalers) {
      const wholesaler = await Wholesaler.create(wholesalerData);
      createdWholesalers.push(wholesaler);
      
      console.log(`Created wholesaler: ${wholesaler.firstName} ${wholesaler.lastName} (${wholesaler.email})`);
    }
    
    console.log(`\n✅ Successfully created ${createdWholesalers.length} wholesalers for store: ${store.name}`);
    console.log('Store ID:', storeId);
    
    // Display summary
    const activeCount = createdWholesalers.filter(w => w.status === 'Active').length;
    const pendingCount = createdWholesalers.filter(w => w.status === 'Pending').length;
    const inactiveCount = createdWholesalers.filter(w => w.status === 'Inactive').length;
    
    console.log('\n📊 Summary:');
    console.log(`- Active: ${activeCount}`);
    console.log(`- Pending: ${pendingCount}`);
    console.log(`- Inactive: ${inactiveCount}`);
    console.log(`- Total: ${createdWholesalers.length}`);
    
    console.log('\n🎉 Wholesaler data creation completed!');
    
  } catch (error) {
    console.error('Error in main execution:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateWholesalers }; 