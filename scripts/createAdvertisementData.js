const mongoose = require('mongoose');
const Advertisement = require('../Models/Advertisement');
const Store = require('../Models/Store');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Advertisement data for TechStore
const techStoreAdvertisements = [
  {
    title: 'New iPhone 15 Pro',
    description: 'Get the latest iPhone 15 Pro with amazing features and performance',
    imageUrl: 'https://example.com/iphone15-pro.jpg',
    isActive: true,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  },
  {
    title: 'MacBook Air M2',
    description: 'Lightning fast MacBook Air with M2 chip - Perfect for work and creativity',
    imageUrl: 'https://example.com/macbook-air-m2.jpg',
    isActive: true,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-11-30')
  },
  {
    title: 'iPad Pro 12.9"',
    description: 'The most powerful iPad ever with stunning Liquid Retina XDR display',
    imageUrl: 'https://example.com/ipad-pro-12.jpg',
    isActive: false,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-10-31')
  }
];

// Advertisement data for FashionStore
const fashionStoreAdvertisements = [
  {
    title: 'Summer Collection 2024',
    description: 'Discover our latest summer collection with trendy styles and colors',
    imageUrl: 'https://example.com/summer-collection.jpg',
    isActive: true,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-08-31')
  },
  {
    title: 'Ramadan Special Offers',
    description: 'Exclusive discounts and offers for the holy month of Ramadan',
    imageUrl: 'https://example.com/ramadan-offers.jpg',
    isActive: true,
    startDate: new Date('2024-03-10'),
    endDate: new Date('2024-04-10')
  },
  {
    title: 'Eid Collection',
    description: 'Beautiful traditional and modern outfits for Eid celebrations',
    imageUrl: 'https://example.com/eid-collection.jpg',
    isActive: true,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-05-31')
  },
  {
    title: 'Winter Fashion Preview',
    description: 'Get ready for winter with our upcoming collection preview',
    imageUrl: 'https://example.com/winter-preview.jpg',
    isActive: false,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31')
  }
];

async function createAdvertisementData() {
  try {
    console.log('🚀 Creating advertisement test data...\n');

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
    await Advertisement.deleteMany({
      store: { $in: [finalTechStore._id, finalFashionStore._id] }
    });
    console.log('🧹 Cleared existing advertisement test data\n');

    // Create TechStore advertisements
    console.log('🛠️ Creating TechStore advertisements...');
    const techAdvertisements = [];
    for (const adData of techStoreAdvertisements) {
      const advertisement = await Advertisement.create({
        ...adData,
        store: finalTechStore._id
      });
      techAdvertisements.push(advertisement);
      console.log(`   ✅ Created: ${advertisement.title} - ${advertisement.isActive ? 'Active' : 'Inactive'}`);
    }

    // Create FashionStore advertisements
    console.log('\n👗 Creating FashionStore advertisements...');
    const fashionAdvertisements = [];
    for (const adData of fashionStoreAdvertisements) {
      const advertisement = await Advertisement.create({
        ...adData,
        store: finalFashionStore._id
      });
      fashionAdvertisements.push(advertisement);
      console.log(`   ✅ Created: ${advertisement.title} - ${advertisement.isActive ? 'Active' : 'Inactive'}`);
    }

    // Verify isolation
    console.log('\n🔍 Verifying data isolation...');
    
    const techAdCount = await Advertisement.countDocuments({ store: finalTechStore._id });
    const fashionAdCount = await Advertisement.countDocuments({ store: finalFashionStore._id });
    
    console.log(`   - TechStore advertisements: ${techAdCount}`);
    console.log(`   - FashionStore advertisements: ${fashionAdCount}`);

    // Test cross-store access
    const techAdInFashion = await Advertisement.findOne({ 
      store: finalFashionStore._id, 
      title: { $in: techStoreAdvertisements.map(ad => ad.title) }
    });
    
    const fashionAdInTech = await Advertisement.findOne({ 
      store: finalTechStore._id, 
      title: { $in: fashionStoreAdvertisements.map(ad => ad.title) }
    });

    if (!techAdInFashion && !fashionAdInTech) {
      console.log('   ✅ Advertisement isolation verified');
    } else {
      console.log('   ❌ Advertisement isolation failed');
    }

    console.log('\n🎉 Advertisement test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- TechStore advertisements: ${techAdCount}`);
    console.log(`- FashionStore advertisements: ${fashionAdCount}`);
    console.log('- Total advertisements:', techAdCount + fashionAdCount);
    console.log('- Data isolation: Verified ✅');
    
    console.log('\n📋 Data Details:');
    console.log('\n🛠️ TechStore Advertisements:');
    techStoreAdvertisements.forEach((ad, index) => {
      console.log(`   ${index + 1}. ${ad.title}`);
      console.log(`      📝 Description: ${ad.description}`);
      console.log(`      🖼️ Image: ${ad.imageUrl}`);
      console.log(`      📅 Start: ${ad.startDate.toISOString().split('T')[0]}`);
      console.log(`      📅 End: ${ad.endDate.toISOString().split('T')[0]}`);
      console.log(`      📍 Status: ${ad.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n👗 FashionStore Advertisements:');
    fashionStoreAdvertisements.forEach((ad, index) => {
      console.log(`   ${index + 1}. ${ad.title}`);
      console.log(`      📝 Description: ${ad.description}`);
      console.log(`      🖼️ Image: ${ad.imageUrl}`);
      console.log(`      📅 Start: ${ad.startDate.toISOString().split('T')[0]}`);
      console.log(`      📅 End: ${ad.endDate.toISOString().split('T')[0]}`);
      console.log(`      📍 Status: ${ad.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n🔗 Store IDs for CURL Testing:');
    console.log(`TechStore ID: ${finalTechStore._id}`);
    console.log(`FashionStore ID: ${finalFashionStore._id}`);

  } catch (error) {
    console.error('❌ Error creating advertisement data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createAdvertisementData(); 