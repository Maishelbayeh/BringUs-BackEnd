const mongoose = require('mongoose');
const SocialComment = require('../Models/SocialComment');
require('dotenv').config();
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storeId = '687505893fbf3098648bfe16';

const socialCommentsData = [
  {
    store: storeId,
    platform: 'Facebook',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    personName: 'أحمد محمد',
    personTitle: 'مدير تسويق',
    comment: 'خدمة ممتازة وسريعة! أنصح الجميع بالتجربة.',
    active: true
  },
  {
    store: storeId,
    platform: 'Instagram',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    personName: 'سارة أحمد',
    personTitle: 'مصممة جرافيك',
    comment: 'جودة المنتجات عالية والأسعار معقولة جداً.',
    active: true
  },
  {
    store: storeId,
    platform: 'Twitter',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    personName: 'محمد علي',
    personTitle: 'مطور ويب',
    comment: 'تجربة تسوق رائعة! الموقع سهل الاستخدام.',
    active: true
  },
  {
    store: storeId,
    platform: 'LinkedIn',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    personName: 'فاطمة حسن',
    personTitle: 'مديرة مبيعات',
    comment: 'خدمة عملاء ممتازة وتوصيل سريع.',
    active: true
  },
  {
    store: storeId,
    platform: 'TikTok',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    personName: 'علي محمود',
    personTitle: 'مؤثر رقمي',
    comment: 'أفضل متجر إلكتروني جربته! أنصح الجميع.',
    active: true
  },
  {
    store: storeId,
    platform: 'Facebook',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    personName: 'نور الدين',
    personTitle: 'طالب جامعي',
    comment: 'أسعار منافسة وجودة عالية!',
    active: true
  },
  {
    store: storeId,
    platform: 'Instagram',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    personName: 'خالد عبدالله',
    personTitle: 'مهندس برمجيات',
    comment: 'تجربة تسوق ممتازة! سأعود بالتأكيد.',
    active: true
  },
  {
    store: storeId,
    platform: 'Twitter',
    image: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=150&h=150&fit=crop&crop=face',
    personName: 'ريم سعد',
    personTitle: 'مصممة أزياء',
    comment: 'منتجات رائعة وتوصيل سريع!',
    active: true
  }
];

async function createSocialComments() {
  try {
    console.log('🚀 Starting to create social comments for store:', storeId);
    
    // Clear existing social comments for this store
    await SocialComment.deleteMany({ store: storeId });
    console.log('✅ Cleared existing social comments for this store');
    
    // Insert new social comments
    const createdComments = await SocialComment.insertMany(socialCommentsData);
    
    console.log('✅ Successfully created', createdComments.length, 'social comments');
    console.log('\n📋 Created social comments:');
    
    createdComments.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment.personName} (${comment.platform}) - ${comment.comment.substring(0, 50)}...`);
    });
    
    console.log('\n🎉 Social comments creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating social comments:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createSocialComments(); 