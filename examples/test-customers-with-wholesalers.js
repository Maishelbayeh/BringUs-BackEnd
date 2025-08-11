/**
 * Test Customers with Wholesalers
 * 
 * This example tests getting customers including wholesalers
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test 1: Get all customers (clients + wholesalers)
 */
async function getAllCustomers() {
  try {
    console.log('👥 Getting all customers (clients + wholesalers)...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10`
    );

    console.log('✅ All customers retrieved successfully');
    console.log('📊 Total customers:', response.data.data.length);
    
    // Separate by role
    const clients = response.data.data.filter(customer => customer.role === 'client');
    const wholesalers = response.data.data.filter(customer => customer.role === 'wholesaler');
    
    console.log('👤 Clients:', clients.length);
    console.log('🏪 Wholesalers:', wholesalers.length);
    console.log('📈 Statistics:', JSON.stringify(response.data.statistics, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting all customers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Get only clients
 */
async function getClientsOnly() {
  try {
    console.log('👤 Getting clients only...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&role=client`
    );

    console.log('✅ Clients retrieved successfully');
    console.log('📊 Total clients:', response.data.data.length);
    
    // Verify all are clients
    const allClients = response.data.data.every(customer => customer.role === 'client');
    console.log('✅ All customers are clients:', allClients);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting clients:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Get only wholesalers
 */
async function getWholesalersOnly() {
  try {
    console.log('🏪 Getting wholesalers only...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&role=wholesaler`
    );

    console.log('✅ Wholesalers retrieved successfully');
    console.log('📊 Total wholesalers:', response.data.data.length);
    
    // Verify all are wholesalers
    const allWholesalers = response.data.data.every(customer => customer.role === 'wholesaler');
    console.log('✅ All customers are wholesalers:', allWholesalers);
    
    // Show sample wholesaler data
    if (response.data.data.length > 0) {
      console.log('📋 Sample wholesaler data:', JSON.stringify(response.data.data[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting wholesalers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 4: Search wholesalers
 */
async function searchWholesalers() {
  try {
    console.log('🔍 Searching wholesalers...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&role=wholesaler&search=test`
    );

    console.log('✅ Wholesaler search completed');
    console.log('📊 Search results:', response.data.data.length);
    
    // Show search results
    response.data.data.forEach((wholesaler, index) => {
      console.log(`${index + 1}. ${wholesaler.firstName} ${wholesaler.lastName} - ${wholesaler.email} (${wholesaler.status})`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error searching wholesalers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 5: Get active wholesalers
 */
async function getActiveWholesalers() {
  try {
    console.log('✅ Getting active wholesalers...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&role=wholesaler&status=active`
    );

    console.log('✅ Active wholesalers retrieved');
    console.log('📊 Active wholesalers:', response.data.data.length);
    
    // Show active wholesalers
    response.data.data.forEach((wholesaler, index) => {
      console.log(`${index + 1}. ${wholesaler.firstName} ${wholesaler.lastName} - ${wholesaler.email}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting active wholesalers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 6: Get customers with guests including wholesalers
 */
async function getCustomersWithGuestsAndWholesalers() {
  try {
    console.log('👥 Getting customers with guests (including wholesalers)...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&includeGuests=true`
    );

    console.log('✅ Customers with guests retrieved successfully');
    console.log('📊 Total customers:', response.data.data.length);
    
    // Separate by type
    const clients = response.data.data.filter(customer => !customer.isGuest && customer.role === 'client');
    const wholesalers = response.data.data.filter(customer => !customer.isGuest && customer.role === 'wholesaler');
    const guests = response.data.data.filter(customer => customer.isGuest);
    
    console.log('👤 Registered clients:', clients.length);
    console.log('🏪 Registered wholesalers:', wholesalers.length);
    console.log('👻 Guest customers:', guests.length);
    
    // Show sample data
    if (wholesalers.length > 0) {
      console.log('📋 Sample wholesaler data:', JSON.stringify(wholesalers[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting customers with guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 7: Get detailed statistics
 */
async function getDetailedStatistics() {
  try {
    console.log('📊 Getting detailed statistics...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=1`
    );

    console.log('✅ Detailed statistics retrieved');
    
    const stats = response.data.statistics;
    console.log('📈 Customer Statistics:');
    console.log(`   • Total customers: ${stats.total}`);
    console.log(`   • Active customers: ${stats.active}`);
    console.log(`   • Inactive customers: ${stats.inactive}`);
    console.log(`   • Banned customers: ${stats.banned}`);
    console.log(`   • Email verified: ${stats.emailVerified}`);
    
    if (stats.clients) {
      console.log('👤 Client Statistics:');
      console.log(`   • Total clients: ${stats.clients.total}`);
      console.log(`   • Active clients: ${stats.clients.active}`);
    }
    
    if (stats.wholesalers) {
      console.log('🏪 Wholesaler Statistics:');
      console.log(`   • Total wholesalers: ${stats.wholesalers.total}`);
      console.log(`   • Active wholesalers: ${stats.wholesalers.active}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting statistics:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Customers with Wholesalers Tests\n');
  
  // Test 1: Get all customers
  console.log('='.repeat(60));
  console.log('TEST 1: Get All Customers (Clients + Wholesalers)');
  console.log('='.repeat(60));
  await getAllCustomers();
  
  // Test 2: Get clients only
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Clients Only');
  console.log('='.repeat(60));
  await getClientsOnly();
  
  // Test 3: Get wholesalers only
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Get Wholesalers Only');
  console.log('='.repeat(60));
  await getWholesalersOnly();
  
  // Test 4: Search wholesalers
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Search Wholesalers');
  console.log('='.repeat(60));
  await searchWholesalers();
  
  // Test 5: Get active wholesalers
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Get Active Wholesalers');
  console.log('='.repeat(60));
  await getActiveWholesalers();
  
  // Test 6: Get customers with guests and wholesalers
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Get Customers with Guests (Including Wholesalers)');
  console.log('='.repeat(60));
  await getCustomersWithGuestsAndWholesalers();
  
  // Test 7: Get detailed statistics
  console.log('\n' + '='.repeat(60));
  console.log('TEST 7: Get Detailed Statistics');
  console.log('='.repeat(60));
  await getDetailedStatistics();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Key Features:');
  console.log('   • Get all customers (clients + wholesalers)');
  console.log('   • Filter by role: client or wholesaler');
  console.log('   • Search within specific roles');
  console.log('   • Separate statistics for clients and wholesalers');
  console.log('   • Include guests with role filtering');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  getAllCustomers,
  getClientsOnly,
  getWholesalersOnly,
  searchWholesalers,
  getActiveWholesalers,
  getCustomersWithGuestsAndWholesalers,
  getDetailedStatistics,
  runTests
};
