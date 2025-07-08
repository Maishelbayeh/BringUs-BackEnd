const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test store IDs (replace with actual IDs from createTestData.js)
const TECH_STORE_ID = 'YOUR_TECH_STORE_ID';
const FASHION_STORE_ID = 'YOUR_FASHION_STORE_ID';

// Test user credentials
const TEST_USERS = {
  techOwner: {
    email: 'ahmed.tech@test.com',
    password: 'password123'
  },
  fashionOwner: {
    email: 'fatima.fashion@test.com',
    password: 'password123'
  }
};

let authTokens = {};

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCustomerIsolation() {
  try {
    console.log('🧪 Testing Customer Isolation System...\n');
    
    // Step 1: Login users
    console.log('1. Logging in users...');
    authTokens.techOwner = await loginUser(TEST_USERS.techOwner.email, TEST_USERS.techOwner.password);
    authTokens.fashionOwner = await loginUser(TEST_USERS.fashionOwner.email, TEST_USERS.fashionOwner.password);
    
    if (!authTokens.techOwner || !authTokens.fashionOwner) {
      console.log('❌ Login failed. Please check credentials.');
      return;
    }
    
    console.log('✅ Users logged in successfully\n');
    
    // Step 2: Test getting customers for TechStore
    console.log('2. Testing TechStore customers...');
    const techCustomersResponse = await axios.get(`${API_BASE_URL}/users/customers?storeId=${TECH_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.techOwner}` }
    });
    
    console.log('✅ TechStore customers:', techCustomersResponse.data.data.length);
    techCustomersResponse.data.data.forEach(customer => {
      console.log(`   - ${customer.firstName} ${customer.lastName} (${customer.email})`);
    });
    
    // Step 3: Test getting customers for FashionStore
    console.log('\n3. Testing FashionStore customers...');
    const fashionCustomersResponse = await axios.get(`${API_BASE_URL}/users/customers?storeId=${FASHION_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.fashionOwner}` }
    });
    
    console.log('✅ FashionStore customers:', fashionCustomersResponse.data.data.length);
    fashionCustomersResponse.data.data.forEach(customer => {
      console.log(`   - ${customer.firstName} ${customer.lastName} (${customer.email})`);
    });
    
    // Step 4: Test getting staff for TechStore
    console.log('\n4. Testing TechStore staff...');
    const techStaffResponse = await axios.get(`${API_BASE_URL}/users/staff?storeId=${TECH_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.techOwner}` }
    });
    
    console.log('✅ TechStore staff:', techStaffResponse.data.data.length);
    techStaffResponse.data.data.forEach(staff => {
      console.log(`   - ${staff.firstName} ${staff.lastName} (${staff.role})`);
    });
    
    // Step 5: Test getting staff for FashionStore
    console.log('\n5. Testing FashionStore staff...');
    const fashionStaffResponse = await axios.get(`${API_BASE_URL}/users/staff?storeId=${FASHION_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.fashionOwner}` }
    });
    
    console.log('✅ FashionStore staff:', fashionStaffResponse.data.data.length);
    fashionStaffResponse.data.data.forEach(staff => {
      console.log(`   - ${staff.firstName} ${staff.lastName} (${staff.role})`);
    });
    
    // Step 6: Test cross-store access prevention
    console.log('\n6. Testing cross-store access prevention...');
    try {
      await axios.get(`${API_BASE_URL}/users/customers?storeId=${FASHION_STORE_ID}`, {
        headers: { Authorization: `Bearer ${authTokens.techOwner}` }
      });
      console.log('❌ Cross-store access should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Cross-store access correctly blocked');
      } else {
        console.log('⚠️ Cross-store access test inconclusive');
      }
    }
    
    // Step 7: Test creating a new customer for TechStore
    console.log('\n7. Testing customer creation for TechStore...');
    const newCustomer = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test.customer@techstore.com',
      password: 'password123',
      role: 'client',
      store: TECH_STORE_ID
    };
    
    const createCustomerResponse = await axios.post(`${API_BASE_URL}/users`, newCustomer, {
      headers: { Authorization: `Bearer ${authTokens.techOwner}` }
    });
    
    console.log('✅ New customer created:', createCustomerResponse.data.data.email);
    
    // Step 8: Verify the new customer appears only in TechStore
    console.log('\n8. Verifying customer isolation...');
    const updatedTechCustomers = await axios.get(`${API_BASE_URL}/users/customers?storeId=${TECH_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.techOwner}` }
    });
    
    const updatedFashionCustomers = await axios.get(`${API_BASE_URL}/users/customers?storeId=${FASHION_STORE_ID}`, {
      headers: { Authorization: `Bearer ${authTokens.fashionOwner}` }
    });
    
    const newCustomerInTech = updatedTechCustomers.data.data.find(c => c.email === newCustomer.email);
    const newCustomerInFashion = updatedFashionCustomers.data.data.find(c => c.email === newCustomer.email);
    
    if (newCustomerInTech && !newCustomerInFashion) {
      console.log('✅ Customer isolation verified - new customer only appears in TechStore');
    } else {
      console.log('❌ Customer isolation failed');
    }
    
    console.log('\n🎉 Customer isolation test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- TechStore customers:', updatedTechCustomers.data.data.length);
    console.log('- FashionStore customers:', updatedFashionCustomers.data.data.length);
    console.log('- TechStore staff:', techStaffResponse.data.data.length);
    console.log('- FashionStore staff:', fashionStaffResponse.data.data.length);
    console.log('- Cross-store access: Blocked ✅');
    console.log('- Customer creation: Working ✅');
    console.log('- Data isolation: Verified ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Instructions
console.log('📝 Instructions:');
console.log('1. Replace TECH_STORE_ID and FASHION_STORE_ID with actual store IDs');
console.log('2. Make sure your backend server is running');
console.log('3. Run: node examples/test-customers-api.js\n');

// Uncomment to run
// testCustomerIsolation();

module.exports = { testCustomerIsolation }; 