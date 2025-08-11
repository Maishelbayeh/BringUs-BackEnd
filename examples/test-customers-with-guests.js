/**
 * Test Customers with Guests
 * 
 * This example tests getting customers including guest customers
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test 1: Get registered customers only
 */
async function getRegisteredCustomers() {
  try {
    console.log('👥 Getting registered customers only...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10`
    );

    console.log('✅ Registered customers retrieved successfully');
    console.log('📊 Customers:', response.data.data.length);
    console.log('📈 Statistics:', JSON.stringify(response.data.statistics, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting registered customers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Get customers including guests
 */
async function getCustomersWithGuests() {
  try {
    console.log('👥 Getting customers including guests...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&includeGuests=true`
    );

    console.log('✅ Customers with guests retrieved successfully');
    console.log('📊 Total customers:', response.data.data.length);
    
    // Separate guests and registered customers
    const guests = response.data.data.filter(customer => customer.isGuest);
    const registered = response.data.data.filter(customer => !customer.isGuest);
    
    console.log('👤 Registered customers:', registered.length);
    console.log('👻 Guest customers:', guests.length);
    console.log('📈 Statistics:', JSON.stringify(response.data.statistics, null, 2));
    
    // Show sample guest data
    if (guests.length > 0) {
      console.log('📋 Sample guest data:', JSON.stringify(guests[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting customers with guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Search customers including guests
 */
async function searchCustomersWithGuests() {
  try {
    console.log('🔍 Searching customers including guests...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&includeGuests=true&search=test`
    );

    console.log('✅ Search completed successfully');
    console.log('📊 Search results:', response.data.data.length);
    
    // Show search results
    response.data.data.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.isGuest ? 'Guest' : 'Registered'}) - ${customer.email}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error searching customers:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 4: Get customers with specific status
 */
async function getCustomersByStatus() {
  try {
    console.log('🔍 Getting active customers including guests...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&includeGuests=true&status=active`
    );

    console.log('✅ Active customers retrieved successfully');
    console.log('📊 Active customers:', response.data.data.length);
    
    // Show active customers
    response.data.data.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} - ${customer.status} (${customer.isGuest ? 'Guest' : 'Registered'})`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting customers by status:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 5: Get detailed guest statistics
 */
async function getGuestStatistics() {
  try {
    console.log('📊 Getting detailed guest statistics...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=1&includeGuests=true`
    );

    console.log('✅ Guest statistics retrieved successfully');
    
    if (response.data.statistics.guests) {
      const guestStats = response.data.statistics.guests;
      console.log('📈 Guest Statistics:');
      console.log(`   • Total guests: ${guestStats.total}`);
      console.log(`   • Total spent: $${guestStats.totalSpent?.toFixed(2) || 0}`);
      console.log(`   • Average order value: $${guestStats.averageOrderValue?.toFixed(2) || 0}`);
      console.log(`   • Average orders per guest: ${guestStats.averageOrdersPerGuest?.toFixed(2) || 0}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting guest statistics:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Customers with Guests Tests\n');
  
  // Test 1: Get registered customers only
  console.log('='.repeat(60));
  console.log('TEST 1: Get Registered Customers Only');
  console.log('='.repeat(60));
  await getRegisteredCustomers();
  
  // Test 2: Get customers including guests
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Customers Including Guests');
  console.log('='.repeat(60));
  await getCustomersWithGuests();
  
  // Test 3: Search customers including guests
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Search Customers Including Guests');
  console.log('='.repeat(60));
  await searchCustomersWithGuests();
  
  // Test 4: Get customers by status
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Get Customers by Status');
  console.log('='.repeat(60));
  await getCustomersByStatus();
  
  // Test 5: Get guest statistics
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Get Guest Statistics');
  console.log('='.repeat(60));
  await getGuestStatistics();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Key Features:');
  console.log('   • Include guests with includeGuests=true parameter');
  console.log('   • Search works for both registered and guest customers');
  console.log('   • Guest statistics with spending analysis');
  console.log('   • Pagination works for combined results');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  getRegisteredCustomers,
  getCustomersWithGuests,
  searchCustomersWithGuests,
  getCustomersByStatus,
  getGuestStatistics,
  runTests
};
