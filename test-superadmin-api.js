/**
 * Test Superadmin API
 * 
 * Simple test script to verify Superadmin API endpoints are working
 */

const API_BASE_URL = 'http://localhost:5001/api';

// Test function to check if server is running
async function testServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is running');
      console.log('📊 API Info:', data.message);
      console.log('🔗 Available endpoints:', data.endpoints);
      return true;
    } else {
      console.error('❌ Server health check failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Test function to check Swagger documentation
async function testSwaggerDocs() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api-docs`);
    
    if (response.ok) {
      console.log('✅ Swagger documentation is accessible');
      console.log('📖 Swagger URL:', `${API_BASE_URL.replace('/api', '')}/api-docs`);
      return true;
    } else {
      console.error('❌ Swagger documentation not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot access Swagger docs:', error.message);
    return false;
  }
}

// Test function to check superadmin endpoints (without auth)
async function testSuperadminEndpoints() {
  const endpoints = [
    '/superadmin/stores',
    '/superadmin/statistics'
  ];

  console.log('\n🔍 Testing Superadmin endpoints (should return 401/403 without auth):');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        console.log(`✅ ${endpoint} - Properly protected (${response.status})`);
      } else {
        console.log(`⚠️ ${endpoint} - Unexpected response (${response.status}):`, data.message);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - Error:`, error.message);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Superadmin API Tests...\n');

  // Test 1: Server Health
  console.log('1️⃣ Testing server health...');
  const serverHealthy = await testServerHealth();
  console.log('');

  if (!serverHealthy) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('💡 Run: npm start');
    return;
  }

  // Test 2: Swagger Documentation
  console.log('2️⃣ Testing Swagger documentation...');
  await testSwaggerDocs();
  console.log('');

  // Test 3: Superadmin Endpoints Protection
  console.log('3️⃣ Testing endpoint protection...');
  await testSuperadminEndpoints();
  console.log('');

  console.log('✅ All tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Create a superadmin user using: node scripts/createSuperAdmin.js');
  console.log('2. Get authentication token by logging in');
  console.log('3. Test endpoints with proper authentication');
  console.log('4. Check Swagger UI for interactive documentation');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testServerHealth,
  testSwaggerDocs,
  testSuperadminEndpoints,
  runTests
};
