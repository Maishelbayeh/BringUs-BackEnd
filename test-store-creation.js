const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

// Test data
const testStore = {
  nameAr: 'متجر الاختبار',
  nameEn: 'Test Store',
  descriptionAr: 'متجر للاختبار',
  descriptionEn: 'A great store',
  slug: 'test-store-' + Date.now(),
  whatsappNumber: '+1234567890',
  contact: {
    email: 'contact@mystore.com',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  },
  settings: {
    mainColor: '#FF0000',
    language: 'en',
    storeDiscount: 10,
    timezone: 'UTC',
    taxRate: 5,
    shippingEnabled: true,
    storeSocials: {
      facebook: 'https://facebook.com/teststore',
      instagram: 'https://instagram.com/teststore',
      twitter: 'https://twitter.com/teststore',
      youtube: 'https://youtube.com/teststore',
      linkedin: 'https://linkedin.com/teststore',
      telegram: 'https://t.me/teststore',
      snapchat: 'teststore',
      pinterest: 'https://pinterest.com/teststore',
      tiktok: 'https://tiktok.com/@teststore'
    }
  }
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createStore() {
  try {
    console.log('🏪 Creating store...');
    
    const formData = new FormData();
    
    // Add text fields
    formData.append('nameAr', testStore.nameAr);
    formData.append('nameEn', testStore.nameEn);
    formData.append('descriptionAr', testStore.descriptionAr);
    formData.append('descriptionEn', testStore.descriptionEn);
    formData.append('slug', testStore.slug);
    formData.append('whatsappNumber', testStore.whatsappNumber);
    
    // Add JSON fields as strings
    formData.append('contact', JSON.stringify(testStore.contact));
    formData.append('settings', JSON.stringify(testStore.settings));
    
    // Add logo file if exists
    const logoPath = path.join(__dirname, 'bag.png');
    if (fs.existsSync(logoPath)) {
      formData.append('logo', fs.createReadStream(logoPath), {
        filename: 'bag.png',
        contentType: 'image/png'
      });
      console.log('📁 Logo file added');
    } else {
      console.log('⚠️  Logo file not found, creating store without logo');
    }
    
    console.log('📤 Sending request with form data...');
    
    const response = await axios.post(`${BASE_URL}/stores`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Store created successfully');
    console.log('📊 Store data:', JSON.stringify(response.data, null, 2));
    return response.data.data._id;
  } catch (error) {
    console.error('❌ Create store failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function getStore(storeId) {
  try {
    console.log('🔍 Getting store...');
    const response = await axios.get(`${BASE_URL}/stores/${storeId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Store retrieved successfully');
    console.log('📊 Store data:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Get store failed:', error.response?.data || error.message);
    return null;
  }
}

async function getStoreBySlug(slug) {
  try {
    console.log('🔍 Getting store by slug...');
    const response = await axios.get(`${BASE_URL}/stores/slug/${slug}`);
    
    console.log('✅ Store retrieved by slug successfully');
    console.log('📊 Store data:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Get store by slug failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Store Creation Tests...\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Create store
  const storeId = await createStore();
  if (!storeId) {
    console.log('❌ Cannot proceed without store creation');
    return;
  }
  
  // Get store by ID
  await getStore(storeId);
  
  // Get store by slug
  await getStoreBySlug(testStore.slug);
  
  console.log('\n🎉 Store creation tests completed!');
}

// Run tests
runTests().catch(console.error); 