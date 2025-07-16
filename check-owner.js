const mongoose = require('mongoose');
const Owner = require('./Models/Owner');
const Store = require('./Models/Store');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function checkOwner() {
  try {
    await mongoose.connect(MONGODB_URI);
    //CONSOLE.log('✅ Connected to MongoDB');

    const superadminId = '6863f791f1a6dba57fe0e323';
    
    // Check if owner exists
    const owner = await Owner.findOne({ userId: superadminId }).populate('storeId');
    //CONSOLE.log('Owner record:', owner);

    if (!owner) {
      //CONSOLE.log('❌ No owner record found for superadmin');
      
      // Check available stores
      const stores = await Store.find({ status: 'active' });
      //CONSOLE.log('Available stores:', stores);
      
      if (stores.length > 0) {
        //CONSOLE.log('✅ Found active stores, you can create an owner record');
      }
    } else {
      //CONSOLE.log('✅ Owner record found');
      //CONSOLE.log('Store:', owner.storeId);
    }

  } catch (error) {
    //CONSOLE.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    //CONSOLE.log('Disconnected from MongoDB');
  }
}

checkOwner(); 