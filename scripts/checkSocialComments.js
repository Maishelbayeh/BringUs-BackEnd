const mongoose = require('mongoose');
const SocialComment = require('../Models/SocialComment');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  // Removed deprecated options
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const storeId = '687505893fbf3098648bfe16';

async function checkSocialComments() {
  try {
    console.log('🔍 Checking social comments for store:', storeId);
    
    // Check if storeId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      console.log('❌ Invalid storeId format');
      return;
    }
    
    // Find all social comments for this store
    const comments = await SocialComment.find({ store: storeId });
    
    console.log('📊 Found', comments.length, 'social comments');
    
    if (comments.length > 0) {
      console.log('\n📋 Social comments:');
      comments.forEach((comment, index) => {
        console.log(`${index + 1}. ${comment.personName} (${comment.platform}) - ${comment.comment.substring(0, 50)}...`);
        console.log(`   Store ID: ${comment.store}`);
        console.log(`   Active: ${comment.active}`);
        console.log('---');
      });
    } else {
      console.log('❌ No social comments found for this store');
      
      // Check if there are any social comments at all
      const allComments = await SocialComment.find({});
      console.log('📊 Total social comments in database:', allComments.length);
      
      if (allComments.length > 0) {
        console.log('\n📋 Sample comments:');
        allComments.slice(0, 3).forEach((comment, index) => {
          console.log(`${index + 1}. ${comment.personName} (${comment.platform}) - Store: ${comment.store}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking social comments:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
checkSocialComments(); 