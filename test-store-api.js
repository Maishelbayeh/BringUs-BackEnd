const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testStore = {
  nameAr: 'متجر الاختبار',
  nameEn: 'Test Store',
  descriptionAr: 'متجر للاختبار',
  descriptionEn: 'Store for testing',
  slug: 'test-store-' + Date.now(),
  whatsappNumber: '+1234567890',
  contact: {
    email: 'test@store.com',
    phone: '+1234567890',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
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
    Object.keys(testStore).forEach(key => {
      if (key === 'contact' || key === 'settings') {
        formData.append(key, JSON.stringify(testStore[key]));
      } else {
        formData.append(key, testStore[key]);
      }
    });
    
    // Add logo file if exists
    const logoPath = path.join(__dirname, 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      formData.append('logo', fs.createReadStream(logoPath));
      console.log('📁 Logo file added');
    } else {
      console.log('⚠️  Logo file not found, creating store without logo');
    }
    
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

async function updateStore(storeId) {
  try {
    console.log('🔄 Updating store...');
    
    const updateData = {
      nameAr: 'متجر محدث',
      nameEn: 'Updated Store',
      descriptionAr: 'متجر محدث للاختبار',
      descriptionEn: 'Updated store for testing',
      settings: {
        mainColor: '#00FF00',
        language: 'ar',
        storeDiscount: 15,
        timezone: 'Asia/Dubai',
        taxRate: 7,
        shippingEnabled: false
      }
    };
    
    const formData = new FormData();
    
    // Add text fields
    Object.keys(updateData).forEach(key => {
      if (key === 'settings') {
        formData.append(key, JSON.stringify(updateData[key]));
      } else {
        formData.append(key, updateData[key]);
      }
    });
    
    const response = await axios.put(`${BASE_URL}/stores/${storeId}`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Store updated successfully');
    console.log('📊 Updated store data:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Update store failed:', error.response?.data || error.message);
    return null;
  }
}

async function getAllStores() {
  try {
    console.log('📋 Getting all stores...');
    const response = await axios.get(`${BASE_URL}/stores`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ All stores retrieved successfully');
    console.log(`📊 Found ${response.data.count} stores`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Get all stores failed:', error.response?.data || error.message);
    return null;
  }
}

async function deleteStore(storeId) {
  try {
    console.log('🗑️  Deleting store...');
    const response = await axios.delete(`${BASE_URL}/stores/${storeId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Store deleted successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Delete store failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Store API Tests...\n');
  
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
  
  // Update store
  await updateStore(storeId);
  
  // Get all stores
  await getAllStores();
  
  // Delete store
  await deleteStore(storeId);
  
  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests().catch(console.error); 