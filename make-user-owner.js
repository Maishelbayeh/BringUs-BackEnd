const mongoose = require('mongoose');
const User = require('./Models/User');
const Store = require('./Models/Store');
const Owner = require('./Models/Owner');

// MongoDB connection string - uses same as server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

// User and Store IDs
const USER_ID = '68de4e4e9d281851c29f1fc6';
const STORE_ID = '68de4e4b9d281851c29f1fc3';

async function makeUserOwner() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    console.log(`\n🔍 Finding user: ${USER_ID}`);
    const user = await User.findById(USER_ID);
    
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      currentRole: user.role,
      currentStore: user.store
    });

    // Find store
    console.log(`\n🔍 Finding store: ${STORE_ID}`);
    const store = await Store.findById(STORE_ID);
    
    if (!store) {
      console.error('❌ Store not found');
      process.exit(1);
    }

    console.log('✅ Store found:', {
      id: store._id,
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      slug: store.slug,
      currentOwner: store.owner
    });

    // Check if user is already owner
    if (user.role === 'admin' && user.store?.toString() === STORE_ID) {
      console.log('\n⚠️ User is already an admin of this store');
    }

    // Update user to be admin/owner of the store
    console.log('\n📝 Updating user...');
    user.role = 'admin';
    user.store = STORE_ID;
    await user.save();
    console.log('✅ User updated:', {
      role: user.role,
      store: user.store
    });

    // Create or update Owner record
    console.log('\n📝 Creating/Updating Owner record...');
    
    // Check if owner record already exists
    let ownerRecord = await Owner.findOne({ userId: USER_ID, storeId: STORE_ID });
    
    if (ownerRecord) {
      console.log('⚠️ Owner record already exists, updating...');
      ownerRecord.status = 'active';
      ownerRecord.isPrimaryOwner = true;
      ownerRecord.permissions = [
        'manage_store',
        'manage_users',
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_inventory',
        'view_analytics',
        'manage_settings'
      ];
      await ownerRecord.save();
      console.log('✅ Owner record updated');
    } else {
      console.log('📝 Creating new Owner record...');
      ownerRecord = await Owner.create({
        userId: USER_ID,
        storeId: STORE_ID,
        status: 'active',
        isPrimaryOwner: true,
        permissions: [
          'manage_store',
          'manage_users',
          'manage_products',
          'manage_categories',
          'manage_orders',
          'manage_inventory',
          'view_analytics',
          'manage_settings'
        ]
      });
      console.log('✅ Owner record created:', {
        id: ownerRecord._id,
        userId: ownerRecord.userId,
        storeId: ownerRecord.storeId,
        isPrimaryOwner: ownerRecord.isPrimaryOwner
      });
    }

    console.log('\n✅ User is now the owner of the store!');

    // Verify changes
    console.log('\n🔍 Verifying changes...');
    const updatedUser = await User.findById(USER_ID).populate('store', 'nameAr nameEn slug');
    const updatedStore = await Store.findById(STORE_ID);
    const verifyOwner = await Owner.findOne({ userId: USER_ID, storeId: STORE_ID });

    console.log('\n✅ Final verification:');
    console.log('User:', {
      id: updatedUser._id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      email: updatedUser.email,
      role: updatedUser.role,
      store: updatedUser.store ? {
        id: updatedUser.store._id,
        name: updatedUser.store.nameEn || updatedUser.store.nameAr,
        slug: updatedUser.store.slug
      } : null
    });

    console.log('Store:', {
      id: updatedStore._id,
      name: updatedStore.nameEn || updatedStore.nameAr,
      slug: updatedStore.slug
    });

    console.log('Owner Record:', {
      id: verifyOwner._id,
      userId: verifyOwner.userId,
      storeId: verifyOwner.storeId,
      status: verifyOwner.status,
      isPrimaryOwner: verifyOwner.isPrimaryOwner,
      permissions: verifyOwner.permissions
    });

    console.log('\n🎉 Success! User is now the admin/owner of the store with full permissions!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    console.log('\n🔌 Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  }
}

// Run the script
makeUserOwner();

