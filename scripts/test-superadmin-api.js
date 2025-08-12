const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const SUPERADMIN_EMAIL = 'superadmin@gmail.com';
const SUPERADMIN_PASSWORD = '123123';

// Test functions
async function loginSuperAdmin() {
  try {
    console.log('🔐 Logging in superadmin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    if (response.data.success) {
      console.log('✅ Login successful');
      return response.data.token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetAllStores(token) {
  try {
    console.log('\n📋 Testing Get All Stores...');
    const response = await axios.get(`${BASE_URL}/superadmin/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Get All Stores successful');
      console.log(`📊 Found ${response.data.count} stores`);
      
      if (response.data.data.length > 0) {
        const store = response.data.data[0];
        console.log(`🏪 Sample store: ${store.nameEn} (${store.status})`);
        console.log(`👥 Owners: ${store.owners.length}`);
      }
    } else {
      console.log('❌ Get All Stores failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Get All Stores error:', error.response?.data?.message || error.message);
  }
}

async function testGetStatistics(token) {
  try {
    console.log('\n📊 Testing Get Statistics...');
    const response = await axios.get(`${BASE_URL}/superadmin/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Get Statistics successful');
      const stats = response.data.data;
      console.log(`🏪 Stores: ${stats.stores.total} total, ${stats.stores.active} active, ${stats.stores.inactive} inactive, ${stats.stores.suspended} suspended`);
      console.log(`👥 Owners: ${stats.owners.total} total, ${stats.owners.active} active, ${stats.owners.inactive} inactive`);
    } else {
      console.log('❌ Get Statistics failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Get Statistics error:', error.response?.data?.message || error.message);
  }
}

async function testUpdateStoreStatus(token) {
  try {
    console.log('\n🔄 Testing Update Store Status...');
    
    // First get all stores to find a store ID
    const storesResponse = await axios.get(`${BASE_URL}/superadmin/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!storesResponse.data.success || storesResponse.data.data.length === 0) {
      console.log('⚠️ No stores found to test status update');
      return;
    }

    const storeId = storesResponse.data.data[0]._id;
    const currentStatus = storesResponse.data.data[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    console.log(`🔄 Updating store ${storeId} status from ${currentStatus} to ${newStatus}...`);

    const response = await axios.patch(`${BASE_URL}/superadmin/stores/${storeId}/status`, {
      status: newStatus
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Update Store Status successful');
      console.log(`📝 Message: ${response.data.message}`);
    } else {
      console.log('❌ Update Store Status failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Update Store Status error:', error.response?.data?.message || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting SuperAdmin API Tests...\n');

  // Login
  const token = await loginSuperAdmin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Run tests
  await testGetAllStores(token);
  await testGetStatistics(token);
  await testUpdateStoreStatus(token);

  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  loginSuperAdmin,
  testGetAllStores,
  testGetStatistics,
  testUpdateStoreStatus,
  runTests
};
