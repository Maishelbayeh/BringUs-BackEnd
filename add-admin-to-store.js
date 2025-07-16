const mongoose = require('mongoose');
const User = require('./Models/User');
const Owner = require('./Models/Owner');
const Store = require('./Models/Store');

const STORE_ID = '687505893fbf3098648bfe16';
const ADMIN_EMAIL = 'halakmail95@gmail.com';
const ADMIN_PASSWORD = '123123';

async function addAdminToStore() {
  try {
    //CONSOLE.log('🔄 Adding admin to store...');
    //CONSOLE.log(`📝 Store ID: ${STORE_ID}`);
    //CONSOLE.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
    
    // Check if store exists
    const store = await Store.findById(STORE_ID);
    if (!store) {
      //CONSOLE.log('❌ Store not found!');
      return;
    }
    //CONSOLE.log(`✅ Store found: ${store.nameAr} (${store.nameEn})`);
    
    // Check if user exists
    let user = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!user) {
      //CONSOLE.log('👤 Creating new admin user...');
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        store: STORE_ID,
        isActive: true
      });
      //CONSOLE.log(`✅ Created new admin user: ${user.firstName} ${user.lastName}`);
    } else {
      //CONSOLE.log(`✅ User exists: ${user.firstName} ${user.lastName}`);
      
      // Update user role and store if needed
      if (user.role !== 'admin') {
        user.role = 'admin';
        user.store = STORE_ID;
        await user.save();
        //CONSOLE.log('✅ Updated user role to admin');
      }
    }
    
    // Check if owner relationship exists
    const existingOwner = await Owner.findOne({
      userId: user._id,
      storeId: STORE_ID
    });
    
    if (!existingOwner) {
      //CONSOLE.log('🔗 Creating owner relationship...');
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
      //CONSOLE.log('✅ Owner relationship created successfully');
    } else {
      //CONSOLE.log('✅ Owner relationship already exists');
    }
    
    //CONSOLE.log('🎉 Admin successfully added to store!');
    //CONSOLE.log('📊 Summary:');
    //CONSOLE.log(`   User ID: ${user._id}`);
    //CONSOLE.log(`   Store ID: ${STORE_ID}`);
    //CONSOLE.log(`   Role: ${user.role}`);
    //CONSOLE.log(`   Email: ${user.email}`);
    
  } catch (error) {
    //CONSOLE.error('❌ Error adding admin to store:', error);
  } finally {
    mongoose.connection.close();
    //CONSOLE.log('🔌 Database connection closed');
  }
}

// Connect to database and run
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    //CONSOLE.log('🔗 Connected to MongoDB');
    addAdminToStore();
  })
  .catch(err => {
    //CONSOLE.error('❌ Database connection error:', err);
    process.exit(1);
  }); 