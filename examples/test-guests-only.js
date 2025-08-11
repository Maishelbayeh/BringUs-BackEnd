/**
 * Test Guests Only
 * 
 * This example tests getting guest customers only
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';

/**
 * Test 1: Get guests only
 */
async function getGuestsOnly() {
  try {
    console.log('👻 Getting guests only...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=10`
    );

    console.log('✅ Guests retrieved successfully');
    console.log('📊 Total guests:', response.data.data.length);
    console.log('📈 Statistics:', JSON.stringify(response.data.statistics, null, 2));
    
    // Show sample guest data
    if (response.data.data.length > 0) {
      console.log('📋 Sample guest data:', JSON.stringify(response.data.data[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 2: Search guests
 */
async function searchGuests() {
  try {
    console.log('🔍 Searching guests...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=10&search=test`
    );

    console.log('✅ Guest search completed');
    console.log('📊 Search results:', response.data.data.length);
    
    // Show search results
    response.data.data.forEach((guest, index) => {
      console.log(`${index + 1}. ${guest.firstName} ${guest.lastName} - ${guest.email} (${guest.orderCount} orders, $${guest.totalSpent})`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error searching guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 3: Sort guests by total spent
 */
async function sortGuestsBySpending() {
  try {
    console.log('💰 Getting guests sorted by total spent...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=5&sortBy=totalSpent&sortOrder=desc`
    );

    console.log('✅ Guests sorted by spending');
    console.log('📊 Top spenders:');
    
    response.data.data.forEach((guest, index) => {
      console.log(`${index + 1}. ${guest.firstName} ${guest.lastName} - $${guest.totalSpent} (${guest.orderCount} orders)`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error sorting guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 4: Sort guests by order count
 */
async function sortGuestsByOrderCount() {
  try {
    console.log('📦 Getting guests sorted by order count...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=5&sortBy=orderCount&sortOrder=desc`
    );

    console.log('✅ Guests sorted by order count');
    console.log('📊 Most frequent guests:');
    
    response.data.data.forEach((guest, index) => {
      console.log(`${index + 1}. ${guest.firstName} ${guest.lastName} - ${guest.orderCount} orders ($${guest.totalSpent})`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error sorting guests by order count:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 5: Get recent guests
 */
async function getRecentGuests() {
  try {
    console.log('🕒 Getting recent guests...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=5&sortBy=lastOrderDate&sortOrder=desc`
    );

    console.log('✅ Recent guests retrieved');
    console.log('📊 Recent guests:');
    
    response.data.data.forEach((guest, index) => {
      const lastOrder = new Date(guest.lastOrderDate).toLocaleDateString();
      console.log(`${index + 1}. ${guest.firstName} ${guest.lastName} - Last order: ${lastOrder} ($${guest.totalSpent})`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error getting recent guests:', error.response?.data?.message || error.message);
  }
}

/**
 * Test 6: Get detailed guest statistics
 */
async function getDetailedGuestStatistics() {
  try {
    console.log('📊 Getting detailed guest statistics...');
    
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/guests?page=1&limit=1`
    );

    console.log('✅ Detailed guest statistics retrieved');
    
    const stats = response.data.statistics;
    console.log('📈 Guest Statistics:');
    console.log(`   • Total guests: ${stats.total}`);
    console.log(`   • Total spent: $${stats.totalSpent?.toFixed(2) || 0}`);
    console.log(`   • Average order value: $${stats.averageOrderValue?.toFixed(2) || 0}`);
    console.log(`   • Average orders per guest: ${stats.averageOrdersPerGuest?.toFixed(2) || 0}`);
    console.log(`   • Recent guests (30 days): ${stats.recentGuests}`);
    
    if (stats.topSpenders && stats.topSpenders.length > 0) {
      console.log('🏆 Top Spenders:');
      stats.topSpenders.forEach((spender, index) => {
        console.log(`   ${index + 1}. ${spender.name} - $${spender.totalSpent} (${spender.orderCount} orders)`);
      });
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
  console.log('🚀 Starting Guests Only Tests\n');
  
  // Test 1: Get guests only
  console.log('='.repeat(60));
  console.log('TEST 1: Get Guests Only');
  console.log('='.repeat(60));
  await getGuestsOnly();
  
  // Test 2: Search guests
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Search Guests');
  console.log('='.repeat(60));
  await searchGuests();
  
  // Test 3: Sort by spending
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Sort Guests by Spending');
  console.log('='.repeat(60));
  await sortGuestsBySpending();
  
  // Test 4: Sort by order count
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Sort Guests by Order Count');
  console.log('='.repeat(60));
  await sortGuestsByOrderCount();
  
  // Test 5: Get recent guests
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Get Recent Guests');
  console.log('='.repeat(60));
  await getRecentGuests();
  
  // Test 6: Get detailed statistics
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Get Detailed Guest Statistics');
  console.log('='.repeat(60));
  await getDetailedGuestStatistics();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📋 Key Features:');
  console.log('   • Dedicated guests endpoint: /stores/:storeId/guests');
  console.log('   • Search functionality for guests');
  console.log('   • Multiple sorting options (spending, orders, dates)');
  console.log('   • Detailed statistics and top spenders');
  console.log('   • Pagination support');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  getGuestsOnly,
  searchGuests,
  sortGuestsBySpending,
  sortGuestsByOrderCount,
  getRecentGuests,
  getDetailedGuestStatistics,
  runTests
};
