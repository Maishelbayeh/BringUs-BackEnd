const mongoose = require('mongoose');
const Owner = require('./Models/Owner');
const Store = require('./Models/Store');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function checkOwner() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const superadminId = '6863f791f1a6dba57fe0e323';
    
    // Check if owner exists
    const owner = await Owner.findOne({ userId: superadminId }).populate('storeId');
    console.log('Owner record:', owner);

    if (!owner) {
      console.log('❌ No owner record found for superadmin');
      
      // Check available stores
      const stores = await Store.find({ status: 'active' });
      console.log('Available stores:', stores);
      
      if (stores.length > 0) {
        console.log('✅ Found active stores, you can create an owner record');
      }
    } else {
      console.log('✅ Owner record found');
      console.log('Store:', owner.storeId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkOwner(); 