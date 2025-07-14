const axios = require('axios');

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
    shippingEnabled: true
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
    console.log('📤 Sending request with data:', JSON.stringify(testStore, null, 2));
    
    const response = await axios.post(`${BASE_URL}/stores`, testStore, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
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
  console.log('🚀 Starting Simple Store Creation Tests...\n');
  
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