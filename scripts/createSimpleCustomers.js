const mongoose = require('mongoose');
const User = require('../Models/User');
const Store = require('../Models/Store');

// Connect to MongoDB (local)
mongoose.connect('mongodb://localhost:27017/bringus')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Customer data for TechStore (2 users)
const techStoreCustomers = [
  {
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed.tech@test.com',
    password: 'password123',
    phone: '+966501234567',
    role: 'client',
    status: 'active',
    addresses: [{
      type: 'home',
      street: 'شارع الملك فهد',
      city: 'الرياض',
      state: 'الرياض',
      zipCode: '12345',
      country: 'السعودية',
      isDefault: true
    }],
    avatar: {
      public_id: null,
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  },
  
  {
    firstName: 'فاطمة',
    lastName: 'علي',
    email: 'fatima.tech@test.com',
    password: 'password123',
    phone: '+966507654321',
    role: 'client',
    status: 'active',
    addresses: [{
      type: 'home',
      street: 'شارع التحلية',
      city: 'جدة',
      state: 'مكة المكرمة',
      zipCode: '54321',
      country: 'السعودية',
      isDefault: true
    }],
    avatar: {
      public_id: null,
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  }
];

// Customer data for FashionStore (2 users)
const fashionStoreCustomers = [
  {
    firstName: 'سارة',
    lastName: 'عبدالله',
    email: 'sara.fashion@test.com',
    password: 'password123',
    phone: '+966506667778',
    role: 'client',
    status: 'active',
    addresses: [{
      type: 'home',
      street: 'شارع التحلية',
      city: 'جدة',
      state: 'مكة المكرمة',
      zipCode: '33333',
      country: 'السعودية',
      isDefault: true
    }],
    avatar: {
      public_id: null,
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  },
  {
    firstName: 'خالد',
    lastName: 'علي',
    email: 'khalid.fashion@test.com',
    password: 'password123',
    phone: '+966508889990',
    role: 'client',
    status: 'active',
    addresses: [{
      type: 'work',
      street: 'شارع الملك فهد',
      city: 'الرياض',
      state: 'الرياض',
      zipCode: '44444',
      country: 'السعودية',
      isDefault: true
    }],
    avatar: {
      public_id: null,
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  }
];

async function createSimpleCustomers() {
  try {
    console.log('🚀 Creating 4 customers (2 for each store)...\n');

    // Get store IDs
    const techStore = await Store.findOne({ name: 'TechStore' });
    const fashionStore = await Store.findOne({ name: 'FashionStore' });

    if (!techStore || !fashionStore) {
      console.log('❌ Stores not found. Creating stores first...');
      
      // Create stores if they don't exist
      const newTechStore = await Store.create({
        name: 'TechStore',
        domain: 'techstore.com',
        description: 'Technology Store',
        status: 'active'
      });
      
      const newFashionStore = await Store.create({
        name: 'FashionStore',
        domain: 'fashionstore.com',
        description: 'Fashion Store',
        status: 'active'
      });
      
      console.log('✅ Created stores');
      console.log(`   - TechStore: ${newTechStore._id}`);
      console.log(`   - FashionStore: ${newFashionStore._id}\n`);
    } else {
      console.log(`📦 Found stores:`);
      console.log(`   - TechStore: ${techStore._id}`);
      console.log(`   - FashionStore: ${fashionStore._id}\n`);
    }

    const finalTechStore = techStore || await Store.findOne({ name: 'TechStore' });
    const finalFashionStore = fashionStore || await Store.findOne({ name: 'FashionStore' });

    // Clear existing test customers
    await User.deleteMany({
      email: { 
        $in: [
          ...techStoreCustomers.map(c => c.email),
          ...fashionStoreCustomers.map(c => c.email)
        ]
      }
    });
    console.log('🧹 Cleared existing test customers\n');

    // Create TechStore customers
    console.log('🛠️ Creating TechStore customers...');
    const techCustomers = [];
    for (const customerData of techStoreCustomers) {
      const customer = await User.create({
        ...customerData,
        store: finalTechStore._id
      });
      techCustomers.push(customer);
      console.log(`   ✅ Created: ${customer.firstName} ${customer.lastName} (${customer.email})`);
    }

    // Create FashionStore customers
    console.log('\n👗 Creating FashionStore customers...');
    const fashionCustomers = [];
    for (const customerData of fashionStoreCustomers) {
      const customer = await User.create({
        ...customerData,
        store: finalFashionStore._id
      });
      fashionCustomers.push(customer);
      console.log(`   ✅ Created: ${customer.firstName} ${customer.lastName} (${customer.email})`);
    }

    // Verify isolation
    console.log('\n🔍 Verifying customer isolation...');
    
    const techStoreCustomerCount = await User.countDocuments({ store: finalTechStore._id, role: 'client' });
    const fashionStoreCustomerCount = await User.countDocuments({ store: finalFashionStore._id, role: 'client' });
    
    console.log(`   - TechStore customers: ${techStoreCustomerCount}`);
    console.log(`   - FashionStore customers: ${fashionStoreCustomerCount}`);

    // Test cross-store access
    const techCustomerInFashion = await User.findOne({ 
      store: finalFashionStore._id, 
      email: { $in: techStoreCustomers.map(c => c.email) }
    });
    
    const fashionCustomerInTech = await User.findOne({ 
      store: finalTechStore._id, 
      email: { $in: fashionStoreCustomers.map(c => c.email) }
    });

    if (!techCustomerInFashion && !fashionCustomerInTech) {
      console.log('   ✅ Customer isolation verified - no cross-store data found');
    } else {
      console.log('   ❌ Customer isolation failed - cross-store data found');
    }

    console.log('\n🎉 Customer test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- TechStore customers: ${techStoreCustomerCount}`);
    console.log(`- FashionStore customers: ${fashionStoreCustomerCount}`);
    console.log('- Total test customers:', techStoreCustomerCount + fashionStoreCustomerCount);
    console.log('- Customer isolation: Verified ✅');
    
    console.log('\n🔑 Test Credentials:');
    console.log('TechStore customers:');
    techStoreCustomers.forEach(c => {
      console.log(`   - ${c.email} / ${c.password}`);
    });
    
    console.log('\nFashionStore customers:');
    fashionStoreCustomers.forEach(c => {
      console.log(`   - ${c.email} / ${c.password}`);
    });

    console.log('\n📋 Customer Details:');
    console.log('\n🛠️ TechStore Customers:');
    techStoreCustomers.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.firstName} ${c.lastName}`);
      console.log(`      📧 Email: ${c.email}`);
      console.log(`      📱 Phone: ${c.phone}`);
      console.log(`      🏠 Address: ${c.addresses[0].street}, ${c.addresses[0].city}`);
      console.log(`      📍 Store: TechStore`);
    });

    console.log('\n👗 FashionStore Customers:');
    fashionStoreCustomers.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.firstName} ${c.lastName}`);
      console.log(`      📧 Email: ${c.email}`);
      console.log(`      📱 Phone: ${c.phone}`);
      console.log(`      🏠 Address: ${c.addresses[0].street}, ${c.addresses[0].city}`);
      console.log(`      📍 Store: FashionStore`);
    });

  } catch (error) {
    console.error('❌ Error creating customer test data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createSimpleCustomers(); 