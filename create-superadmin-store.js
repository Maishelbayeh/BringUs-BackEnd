const mongoose = require('mongoose');
const Store = require('./Models/Store');
const Owner = require('./Models/Owner');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function createSuperadminStore() {
  try {
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');

    const superadminId = '6863f791f1a6dba57fe0e323';
    
    // Create a store for superadmin
    const store = new Store({
      name: 'Superadmin Store',
      description: 'Default store for superadmin',
      domain: 'superadmin.bringus.com',
      status: 'active',
      settings: {
        currency: 'ILS',
        language: 'en',
        timezone: 'Asia/Jerusalem'
      },
      contact: {
        email: 'admin@bringus.com',
        phone: '+970598516067',
        address: {
          street: 'Main Street',
          city: 'Ramallah',
          state: 'West Bank',
          zipCode: '00000',
          country: 'Palestine'
        }
      }
    });

    const savedStore = await store.save();
    //CONSOLE.log('✅ Store created:', savedStore._id);

    // Create owner record for superadmin
    const owner = new Owner({
      userId: superadminId,
      storeId: savedStore._id,
      role: 'owner',
      status: 'active',
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
      joinDate: new Date()
    });

    const savedOwner = await owner.save();
    //CONSOLE.log('✅ Owner record created:', savedOwner._id);

    //CONSOLE.log('🎉 Superadmin store setup completed successfully!');
    //CONSOLE.log('Store ID:', savedStore._id);
    //CONSOLE.log('Owner ID:', savedOwner._id);

  } catch (error) {
    //CONSOLE.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('Disconnected from MongoDB');
  }
}

createSuperadminStore(); 