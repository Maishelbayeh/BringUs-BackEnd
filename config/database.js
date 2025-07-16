const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    //CONSOLE.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    //CONSOLE.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 