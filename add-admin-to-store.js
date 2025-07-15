const mongoose = require('mongoose');
const User = require('./Models/User');
const Owner = require('./Models/Owner');
const Store = require('./Models/Store');

const STORE_ID = '687505893fbf3098648bfe16';
const ADMIN_EMAIL = 'halakmail95@gmail.com';
const ADMIN_PASSWORD = '123123';

async function addAdminToStore() {
  try {
    console.log('🔄 Adding admin to store...');
    console.log(`📝 Store ID: ${STORE_ID}`);
    console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
    
    // Check if store exists
    const store = await Store.findById(STORE_ID);
    if (!store) {
      console.log('❌ Store not found!');
      return;
    }
    console.log(`✅ Store found: ${store.nameAr} (${store.nameEn})`);
    
    // Check if user exists
    let user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      console.log('👤 Creating new admin user...');
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        store: STORE_ID,
        isActive: true
      });
      console.log(`✅ Created new admin user: ${user.firstName} ${user.lastName}`);
    } else {
      console.log(`✅ User exists: ${user.firstName} ${user.lastName}`);
      
      // Update user role and store if needed
      if (user.role !== 'admin') {
        user.role = 'admin';
        user.store = STORE_ID;
        await user.save();
        console.log('✅ Updated user role to admin');
      }
    }
    
    // Check if owner relationship exists
    const existingOwner = await Owner.findOne({
      userId: user._id,
      storeId: STORE_ID
    });
    
    if (!existingOwner) {
      console.log('🔗 Creating owner relationship...');
      await Owner.create({
        userId: user._id,
        storeId: STORE_ID,
        permissions: [
          'manage_store',
          'manage_users', 
          'manage_products',
          'manage_categories',
          'manage_orders',
          'manage_inventory',
          'view_analytics',
          'manage_settings'
        ],
        isPrimaryOwner: false,
        status: 'active'
      });
      console.log('✅ Owner relationship created successfully');
    } else {
      console.log('✅ Owner relationship already exists');
    }
    
    console.log('🎉 Admin successfully added to store!');
    console.log('📊 Summary:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email: ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error adding admin to store:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Connect to database and run
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🔗 Connected to MongoDB');
    addAdminToStore();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }); 