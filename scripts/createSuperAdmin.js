const mongoose = require('mongoose');
const User = require('../Models/User');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ 
      email: 'superadmin@gmail.com',
      role: 'superadmin'
    });

    if (existingSuperAdmin) {
      console.log('Superadmin already exists with email: superadmin@gmail.com');
      return;
    }

    // Create superadmin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@gmail.com',
      password: '123123',
      role: 'superadmin',
      status: 'active',
      isEmailVerified: true,
      isActive: true
    });

    console.log('Superadmin created successfully:');
    console.log('Email: superadmin@gmail.com');
    console.log('Password: 123123');
    console.log('Role: superadmin');
    console.log('ID:', superAdmin._id);

  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSuperAdmin(); 