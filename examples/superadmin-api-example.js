/**
 * Superadmin API Example
 * 
 * This example demonstrates how to use the Superadmin API endpoints
 * for managing stores and getting statistics.
 */

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Example: Get all stores with owners information
 */
async function getAllStores() {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN_HERE'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ All stores retrieved successfully:');
      console.log('📊 Total stores:', data.count);
      console.log('🏪 Stores:', data.data);
    } else {
      console.error('❌ Error retrieving stores:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

/**
 * Example: Get store by ID with owners information
 */
async function getStoreById(storeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores/${storeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN_HERE'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Store retrieved successfully:');
      console.log('🏪 Store details:', data.data);
    } else {
      console.error('❌ Error retrieving store:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

/**
 * Example: Update store status
 */
async function updateStoreStatus(storeId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores/${storeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN_HERE'
      },
      body: JSON.stringify({
        status: newStatus // 'active', 'inactive', or 'suspended'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Store status updated successfully:');
      console.log('📝 Message:', data.message);
      console.log('🏪 Updated store:', data.data);
    } else {
      console.error('❌ Error updating store status:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

/**
 * Example: Get stores statistics
 */
async function getStoresStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN_HERE'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Statistics retrieved successfully:');
      console.log('📊 Stores statistics:', data.data.stores);
      console.log('👥 Owners statistics:', data.data.owners);
    } else {
      console.error('❌ Error retrieving statistics:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

/**
 * Example: Complete superadmin workflow
 */
async function superadminWorkflow() {
  console.log('🚀 Starting Superadmin Workflow...\n');

  // 1. Get all stores
  console.log('1️⃣ Getting all stores...');
  await getAllStores();
  console.log('');

  // 2. Get statistics
  console.log('2️⃣ Getting statistics...');
  await getStoresStatistics();
  console.log('');

  // 3. Get specific store (replace with actual store ID)
  console.log('3️⃣ Getting specific store...');
  await getStoreById('507f1f77bcf86cd799439011');
  console.log('');

  // 4. Update store status (replace with actual store ID)
  console.log('4️⃣ Updating store status...');
  await updateStoreStatus('507f1f77bcf86cd799439011', 'active');
  console.log('');

  console.log('✅ Superadmin workflow completed!');
}

/**
 * Example: Authentication helper
 */
async function authenticateSuperadmin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ Superadmin authenticated successfully');
      console.log('🔑 Token:', data.token);
      return data.token;
    } else {
      console.error('❌ Authentication failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

/**
 * Example: Test with authentication
 */
async function testWithAuth() {
  console.log('🔐 Testing with authentication...\n');

  // First authenticate
  const token = await authenticateSuperadmin('superadmin@gmail.com', 'your_password');
  
  if (token) {
    // Update the token in the functions
    const functionsWithToken = {
      getAllStores: () => getAllStoresWithToken(token),
      getStoreById: (storeId) => getStoreByIdWithToken(token, storeId),
      updateStoreStatus: (storeId, status) => updateStoreStatusWithToken(token, storeId, status),
      getStoresStatistics: () => getStoresStatisticsWithToken(token)
    };

    // Test all functions
    await functionsWithToken.getAllStores();
    await functionsWithToken.getStoresStatistics();
  }
}

// Helper functions with token
async function getAllStoresWithToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ All stores retrieved successfully:');
      console.log('📊 Total stores:', data.count);
    } else {
      console.error('❌ Error retrieving stores:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function getStoreByIdWithToken(token, storeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores/${storeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Store retrieved successfully:', data.data.nameEn);
    } else {
      console.error('❌ Error retrieving store:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function updateStoreStatusWithToken(token, storeId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/stores/${storeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Store status updated successfully:', data.message);
    } else {
      console.error('❌ Error updating store status:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function getStoresStatisticsWithToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/superadmin/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Statistics retrieved successfully:');
      console.log('📊 Stores:', data.data.stores);
      console.log('👥 Owners:', data.data.owners);
    } else {
      console.error('❌ Error retrieving statistics:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Export functions for use in other files
module.exports = {
  getAllStores,
  getStoreById,
  updateStoreStatus,
  getStoresStatistics,
  superadminWorkflow,
  authenticateSuperadmin,
  testWithAuth
};

// Example usage (uncomment to test)
// superadminWorkflow();
// testWithAuth();
