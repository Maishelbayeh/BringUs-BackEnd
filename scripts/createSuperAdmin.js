const mongoose = require('mongoose');
const User = require('../Models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  //CONSOLE.log('✅ Connected to MongoDB');
})
.catch((err) => {
  //CONSOLE.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const createSuperAdmin = async () => {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      //CONSOLE.log('❌ Superadmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@bringus.com',
      password: 'admin123456',
      role: 'superadmin',
      status: 'active',
      isEmailVerified: true
    });

    //CONSOLE.log('✅ Superadmin created successfully!');
    //CONSOLE.log('📧 Email:', superAdmin.email);
    //CONSOLE.log('🔑 Password: admin123456');
    //CONSOLE.log('🆔 User ID:', superAdmin._id);
    
    process.exit(0);
  } catch (error) {
    //CONSOLE.error('❌ Error creating superadmin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin(); 