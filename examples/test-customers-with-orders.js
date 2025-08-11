/**
 * Test Customers with Orders
 * 
 * This script tests the updated getCustomersByStoreId function with order counts
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const STORE_ID = '687c9bb0a7b3f2a0831c4675';

async function testCustomersWithOrders() {
  try {
    console.log('🧪 Testing Customers with Orders...\n');
    
    // Test getting customers with orders
    console.log('1. Getting customers with orders:');
    const response = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10`
    );

    console.log('✅ Response status:', response.status);
    console.log('📊 Total customers:', response.data.data.length);
    
    // Show sample customer with orders
    if (response.data.data.length > 0) {
      const sampleCustomer = response.data.data[0];
      console.log('\n📋 Sample customer with orders:');
      console.log('   Name:', `${sampleCustomer.firstName} ${sampleCustomer.lastName}`);
      console.log('   Email:', sampleCustomer.email);
      console.log('   Role:', sampleCustomer.role);
      console.log('   Order Count:', sampleCustomer.orderCount);
      console.log('   Total Spent:', sampleCustomer.totalSpent);
      console.log('   Last Order Date:', sampleCustomer.lastOrderDate);
      console.log('   Is Guest:', sampleCustomer.isGuest);
    }
    
    // Test getting customers with guests
    console.log('\n2. Getting customers with guests:');
    const responseWithGuests = await axios.get(
      `${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=10&includeGuests=true`
    );

    console.log('✅ Response status:', responseWithGuests.status);
    console.log('📊 Total customers + guests:', responseWithGuests.data.data.length);
    
    // Separate customers and guests
    const customers = responseWithGuests.data.data.filter(c => !c.isGuest);
    const guests = responseWithGuests.data.data.filter(c => c.isGuest);
    
    console.log('👤 Registered customers:', customers.length);
    console.log('👻 Guest customers:', guests.length);
    
    // Show sample guest
    if (guests.length > 0) {
      const sampleGuest = guests[0];
      console.log('\n📋 Sample guest:');
      console.log('   Name:', `${sampleGuest.firstName} ${sampleGuest.lastName}`);
      console.log('   Email:', sampleGuest.email);
      console.log('   Order Count:', sampleGuest.orderCount);
      console.log('   Total Spent:', sampleGuest.totalSpent);
      console.log('   Last Order Date:', sampleGuest.lastOrderDate);
      console.log('   Is Guest:', sampleGuest.isGuest);
    }
    
    // Show statistics
    console.log('\n📈 Statistics:');
    console.log('   Total customers:', responseWithGuests.data.statistics.total);
    console.log('   Active customers:', responseWithGuests.data.statistics.active);
    console.log('   Total with guests:', responseWithGuests.data.statistics.totalWithGuests);
    
    if (responseWithGuests.data.statistics.guests) {
      console.log('   Guest statistics:', responseWithGuests.data.statistics.guests);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// Run the test
testCustomersWithOrders();
