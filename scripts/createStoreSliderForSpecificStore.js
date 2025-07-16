const mongoose = require('mongoose');
const StoreSlider = require('../Models/StoreSlider');
const Store = require('../Models/Store');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Store ID to add sliders for
const TARGET_STORE_ID = '687505893fbf3098648bfe16';

// Store slider data for the specific store
const storeSliders = [
  {
    title: 'عروض خاصة - Special Offers',
    description: 'اكتشف أحدث العروض والخصومات على منتجاتنا المميزة - Discover our latest offers and discounts on premium products',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80',
    order: 1,
    isActive: true
  },
  {
    title: 'منتجات جديدة - New Products',
    description: 'تعرف على أحدث المنتجات المضافة إلى متجرنا - Check out the newest products added to our store',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    order: 2,
    isActive: true
  },
  {
    title: 'جولة في المتجر - Store Tour',
    description: 'شاهد جولة افتراضية في متجرنا الجميل - Take a virtual tour of our beautiful store',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    order: 3,
    isActive: true
  },
  {
    title: 'عرض المنتجات - Product Showcase',
    description: 'عرض شامل لأفضل منتجاتنا وأكثرها مبيعاً - Comprehensive showcase of our best and bestselling products',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    order: 4,
    isActive: true
  },
  {
    title: 'فيديو تعريفي - Introduction Video',
    description: 'تعرف على متجرنا وخدماتنا من خلال هذا الفيديو التعريفي - Learn about our store and services through this introduction video',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=3YxaaGgTQYM',
    order: 5,
    isActive: true
  },
  {
    title: 'عروض نهاية الأسبوع - Weekend Offers',
    description: 'خصومات خاصة لفترة محدودة - Limited time special discounts',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    order: 6,
    isActive: false
  },
  {
    title: 'منتجات موسمية - Seasonal Products',
    description: 'منتجات خاصة للموسم الحالي - Special products for the current season',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    order: 7,
    isActive: true
  },
  {
    title: 'فيديو المنتجات - Product Video',
    description: 'شاهد منتجاتنا في العمل مع شرح مفصل - Watch our products in action with detailed explanation',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=ObXiEqzjx9U',
    order: 8,
    isActive: false
  }
];

async function createStoreSliderData() {
  try {
    console.log('🚀 Creating store slider data for specific store...\n');
    console.log(`🎯 Target Store ID: ${TARGET_STORE_ID}\n`);

    // Verify store exists
    const store = await Store.findById(TARGET_STORE_ID);
    if (!store) {
      console.log('❌ Store not found with ID:', TARGET_STORE_ID);
      console.log('Please check the store ID and try again.');
      return;
    }

    console.log(`📦 Found store: ${store.name}`);
    console.log(`   - Domain: ${store.domain}`);
    console.log(`   - Status: ${store.status}\n`);

    // Clear existing slider data for this store
    const deletedCount = await StoreSlider.deleteMany({ store: TARGET_STORE_ID });
    console.log(`🧹 Cleared ${deletedCount.deletedCount} existing sliders for this store\n`);

    // Create sliders
    console.log('🛠️ Creating store sliders...');
    const createdSliders = [];
    
    for (const sliderData of storeSliders) {
      const slider = await StoreSlider.create({
        ...sliderData,
        store: TARGET_STORE_ID
      });
      createdSliders.push(slider);
      console.log(`   ✅ Created: ${slider.title} (${slider.type}) - ${slider.isActive ? 'Active' : 'Inactive'}`);
    }

    // Verify creation
    console.log('\n🔍 Verifying data creation...');
    const totalSliders = await StoreSlider.countDocuments({ store: TARGET_STORE_ID });
    const activeSliders = await StoreSlider.countDocuments({ store: TARGET_STORE_ID, isActive: true });
    const inactiveSliders = await StoreSlider.countDocuments({ store: TARGET_STORE_ID, isActive: false });
    
    console.log(`   - Total sliders: ${totalSliders}`);
    console.log(`   - Active sliders: ${activeSliders}`);
    console.log(`   - Inactive sliders: ${inactiveSliders}`);

    // Test YouTube ID extraction
    console.log('\n🎥 Testing YouTube integration...');
    const videoSliders = await StoreSlider.find({ store: TARGET_STORE_ID, type: 'video' });
    videoSliders.forEach(slider => {
      console.log(`   - ${slider.title}: YouTube ID = ${slider.youtubeId}`);
      console.log(`     Thumbnail: ${slider.thumbnailUrl}`);
    });

    console.log('\n🎉 Store slider data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Store: ${store.name} (${TARGET_STORE_ID})`);
    console.log(`- Total sliders: ${totalSliders}`);
    console.log(`- Active sliders: ${activeSliders}`);
    console.log(`- Inactive sliders: ${inactiveSliders}`);
    console.log(`- Image sliders: ${await StoreSlider.countDocuments({ store: TARGET_STORE_ID, type: 'slider' })}`);
    console.log(`- Video sliders: ${await StoreSlider.countDocuments({ store: TARGET_STORE_ID, type: 'video' })}`);
    
    console.log('\n📋 Data Details:');
    storeSliders.forEach((slider, index) => {
      console.log(`\n   ${index + 1}. ${slider.title}`);
      console.log(`      📝 Description: ${slider.description}`);
      console.log(`      🎯 Type: ${slider.type}`);
      if (slider.type === 'slider') {
        console.log(`      🖼️ Image: ${slider.imageUrl}`);
      } else {
        console.log(`      🎥 Video: ${slider.videoUrl}`);
      }
      console.log(`      📍 Order: ${slider.order}`);
      console.log(`      📍 Status: ${slider.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n✅ Script completed successfully!');
    console.log('\n🔗 You can now view these sliders in your frontend application.');
    console.log('📱 The sliders will be displayed based on their order and active status.');

  } catch (error) {
    console.error('❌ Error creating store slider data:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createStoreSliderData(); 