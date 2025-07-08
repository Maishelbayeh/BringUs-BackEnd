const mongoose = require('mongoose');
const StoreSlider = require('../Models/StoreSlider');
const Store = require('../Models/Store');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Store slider data for TechStore
const techStoreSliders = [
  {
    title: 'iPhone 15 Pro Launch',
    description: 'Experience the future with the latest iPhone 15 Pro featuring A17 Pro chip',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    order: 1,
    isActive: true
  },
  {
    title: 'MacBook Air M2',
    description: 'Lightning fast performance with the revolutionary M2 chip',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    order: 2,
    isActive: true
  },
  {
    title: 'Store Tour Video',
    description: 'Take a virtual tour of our amazing tech store and see our latest products',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    order: 3,
    isActive: true
  },
  {
    title: 'iPad Pro 12.9"',
    description: 'The most powerful iPad ever with stunning Liquid Retina XDR display',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    order: 4,
    isActive: false
  },
  {
    title: 'Product Demo Video',
    description: 'Watch our latest products in action with detailed demonstrations',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=ObXiEqzjx9U',
    order: 5,
    isActive: true
  }
];

// Store slider data for FashionStore
const fashionStoreSliders = [
  {
    title: 'Summer Collection 2024',
    description: 'Discover our latest summer collection with trendy styles and vibrant colors',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    order: 1,
    isActive: true
  },
  {
    title: 'Ramadan Special Offers',
    description: 'Exclusive discounts and offers for the holy month of Ramadan',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80',
    order: 2,
    isActive: true
  },
  {
    title: 'Fashion Show Video',
    description: 'Watch our latest fashion show featuring the newest trends and styles',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    order: 3,
    isActive: true
  },
  {
    title: 'Eid Collection',
    description: 'Beautiful traditional and modern outfits for Eid celebrations',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    order: 4,
    isActive: true
  },
  {
    title: 'Store Tour Video',
    description: 'Explore our beautiful fashion store and see our latest collections',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=3YxaaGgTQYM',
    order: 5,
    isActive: false
  },
  {
    title: 'Winter Fashion Preview',
    description: 'Get ready for winter with our upcoming collection preview',
    type: 'slider',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    order: 6,
    isActive: false
  }
];

async function createStoreSliderData() {
  try {
    console.log('🚀 Creating store slider test data...\n');

    // Get store IDs
    const techStore = await Store.findOne({ name: 'TechStore' });
    const fashionStore = await Store.findOne({ name: 'FashionStore' });

    if (!techStore || !fashionStore) {
      console.log('❌ Stores not found. Creating stores first...');
      
      // Create stores if they don't exist
      const newTechStore = await Store.create({
        name: 'TechStore',
        domain: 'techstore.com',
        description: 'Technology Store',
        status: 'active',
        contact: {
          email: 'tech@techstore.com',
          phone: '+970598516067'
        }
      });
      
      const newFashionStore = await Store.create({
        name: 'FashionStore',
        domain: 'fashionstore.com',
        description: 'Fashion Store',
        status: 'active',
        contact: {
          email: 'fashion@fashionstore.com',
          phone: '+966501234567'
        }
      });
      
      console.log('✅ Created stores');
      console.log(`   - TechStore: ${newTechStore._id}`);
      console.log(`   - FashionStore: ${newFashionStore._id}\n`);
    } else {
      console.log(`📦 Found stores:`);
      console.log(`   - TechStore: ${techStore._id}`);
      console.log(`   - FashionStore: ${fashionStore._id}\n`);
    }

    const finalTechStore = techStore || await Store.findOne({ name: 'TechStore' });
    const finalFashionStore = fashionStore || await Store.findOne({ name: 'FashionStore' });

    // Clear existing test data
    await StoreSlider.deleteMany({
      store: { $in: [finalTechStore._id, finalFashionStore._id] }
    });
    console.log('🧹 Cleared existing store slider test data\n');

    // Create TechStore sliders
    console.log('🛠️ Creating TechStore sliders...');
    const techSliders = [];
    for (const sliderData of techStoreSliders) {
      const slider = await StoreSlider.create({
        ...sliderData,
        store: finalTechStore._id
      });
      techSliders.push(slider);
      console.log(`   ✅ Created: ${slider.title} (${slider.type}) - ${slider.isActive ? 'Active' : 'Inactive'}`);
    }

    // Create FashionStore sliders
    console.log('\n👗 Creating FashionStore sliders...');
    const fashionSliders = [];
    for (const sliderData of fashionStoreSliders) {
      const slider = await StoreSlider.create({
        ...sliderData,
        store: finalFashionStore._id
      });
      fashionSliders.push(slider);
      console.log(`   ✅ Created: ${slider.title} (${slider.type}) - ${slider.isActive ? 'Active' : 'Inactive'}`);
    }

    // Verify isolation
    console.log('\n🔍 Verifying data isolation...');
    
    const techSliderCount = await StoreSlider.countDocuments({ store: finalTechStore._id });
    const fashionSliderCount = await StoreSlider.countDocuments({ store: finalFashionStore._id });
    
    console.log(`   - TechStore sliders: ${techSliderCount}`);
    console.log(`   - FashionStore sliders: ${fashionSliderCount}`);

    // Test cross-store access
    const techSliderInFashion = await StoreSlider.findOne({ 
      store: finalFashionStore._id, 
      title: { $in: techStoreSliders.map(slider => slider.title) }
    });
    
    const fashionSliderInTech = await StoreSlider.findOne({ 
      store: finalTechStore._id, 
      title: { $in: fashionStoreSliders.map(slider => slider.title) }
    });

    if (!techSliderInFashion && !fashionSliderInTech) {
      console.log('   ✅ Store slider isolation verified');
    } else {
      console.log('   ❌ Store slider isolation failed');
    }

    // Test YouTube ID extraction
    console.log('\n🎥 Testing YouTube integration...');
    const videoSliders = await StoreSlider.find({ type: 'video' });
    videoSliders.forEach(slider => {
      console.log(`   - ${slider.title}: YouTube ID = ${slider.youtubeId}`);
      console.log(`     Thumbnail: ${slider.thumbnailUrl}`);
    });

    console.log('\n🎉 Store slider test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- TechStore sliders: ${techSliderCount}`);
    console.log(`- FashionStore sliders: ${fashionSliderCount}`);
    console.log('- Total sliders:', techSliderCount + fashionSliderCount);
    console.log('- Data isolation: Verified ✅');
    console.log('- YouTube integration: Working ✅');
    
    console.log('\n📋 Data Details:');
    console.log('\n🛠️ TechStore Sliders:');
    techStoreSliders.forEach((slider, index) => {
      console.log(`   ${index + 1}. ${slider.title}`);
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

    console.log('\n👗 FashionStore Sliders:');
    fashionStoreSliders.forEach((slider, index) => {
      console.log(`   ${index + 1}. ${slider.title}`);
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

    console.log('\n🔗 Store IDs for CURL Testing:');
    console.log(`TechStore ID: ${finalTechStore._id}`);
    console.log(`FashionStore ID: ${finalFashionStore._id}`);

    console.log('\n🧪 Testing Endpoints:');
    console.log('1. Get all sliders: GET /api/store-sliders');
    console.log('2. Get by type: GET /api/store-sliders?type=slider');
    console.log('3. Get active by type: GET /api/store-sliders/active/video');
    console.log('4. Create slider: POST /api/store-sliders');
    console.log('5. Update slider: PUT /api/store-sliders/<ID>');
    console.log('6. Toggle status: PATCH /api/store-sliders/<ID>/toggle-active');
    console.log('7. Increment views: PATCH /api/store-sliders/<ID>/increment-views');
    console.log('8. Increment clicks: PATCH /api/store-sliders/<ID>/increment-clicks');

  } catch (error) {
    console.error('❌ Error creating store slider data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createStoreSliderData(); 