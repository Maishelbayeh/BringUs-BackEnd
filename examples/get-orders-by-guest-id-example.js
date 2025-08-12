/**
 * Example on how to use the Get Orders by Guest ID API
 * 
 * This file demonstrates how to:
 * 1. Get orders for a specific guest ID
 * 2. Filter orders by status and store
 * 3. Use pagination
 * 4. Handle the response data
 */

const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const GUEST_ID = 'guest_123456789'; // Replace with actual guest ID

/**
 * 1. Get all orders for a guest ID
 */
async function getOrdersByGuestId(guestId, options = {}) {
  try {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10
    };

    // Add optional filters
    if (options.status) params.status = options.status;
    if (options.storeId) params.storeId = options.storeId;

    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params
    });
    
    console.log('✅ Orders retrieved successfully:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting orders by guest ID:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. Get orders with specific status
 */
async function getOrdersByStatus(guestId, status) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params: {
        status: status,
        limit: 20
      }
    });
    
    console.log(`✅ Orders with status '${status}' retrieved:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting orders by status:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 3. Get orders for specific store
 */
async function getOrdersByStore(guestId, storeId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params: {
        storeId: storeId,
        limit: 15
      }
    });
    
    console.log(`✅ Orders for store '${storeId}' retrieved:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting orders by store:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 4. Get orders with pagination
 */
async function getOrdersWithPagination(guestId, page = 1, limit = 5) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params: {
        page: page,
        limit: limit
      }
    });
    
    console.log(`✅ Orders page ${page} retrieved:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting orders with pagination:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 5. Display order information
 */
function displayOrderInfo(orderData) {
  if (!orderData) {
    console.log('❌ No order data available');
    return;
  }

  console.log('\n📊 Order Information:');
  console.log('=====================');
  console.log(`📦 Total Orders: ${orderData.statistics.totalOrders}`);
  console.log(`💰 Total Spending: ${orderData.statistics.totalSpending}`);
  console.log(`📈 Average Spending: ${orderData.statistics.averageSpending}`);
  console.log(`📅 Last Order Date: ${orderData.statistics.lastOrderDate}`);
  console.log(`👤 Guest ID: ${orderData.statistics.guestId}`);

  console.log('\n📄 Pagination Info:');
  console.log('==================');
  console.log(`📄 Current Page: ${orderData.pagination.currentPage}`);
  console.log(`📄 Total Pages: ${orderData.pagination.totalPages}`);
  console.log(`📄 Total Items: ${orderData.pagination.totalItems}`);
  console.log(`📄 Items Per Page: ${orderData.pagination.itemsPerPage}`);
  console.log(`➡️ Has Next Page: ${orderData.pagination.hasNextPage}`);
  console.log(`⬅️ Has Prev Page: ${orderData.pagination.hasPrevPage}`);

  console.log('\n🛒 Orders:');
  console.log('==========');
  orderData.orders.forEach((order, index) => {
    console.log(`\n${index + 1}. Order: ${order.orderNumber}`);
    console.log(`   🏪 Store: ${order.storeName}`);
    console.log(`   💰 Price: ${order.price} ${order.currency}`);
    console.log(`   📊 Status: ${order.status} (${order.statusAr})`);
    console.log(`   💳 Payment: ${order.paymentStatus} (${order.paymentStatusAr})`);
    console.log(`   📅 Created: ${order.createdAt}`);
    console.log(`   📦 Items: ${order.items.length} items`);
    
    // Display items
    order.items.forEach((item, itemIndex) => {
      console.log(`      ${itemIndex + 1}. ${item.name} - Qty: ${item.quantity} - Price: ${item.price}`);
    });
  });
}

/**
 * 6. Example usage
 */
async function runExample() {
  console.log('🚀 Starting Get Orders by Guest ID Example...\n');

  // 1. Get all orders for guest
  console.log('1️⃣ Getting all orders for guest:');
  const allOrders = await getOrdersByGuestId(GUEST_ID);
  if (allOrders) {
    displayOrderInfo(allOrders);
  }

  // 2. Get pending orders
  console.log('\n2️⃣ Getting pending orders:');
  const pendingOrders = await getOrdersByStatus(GUEST_ID, 'pending');
  if (pendingOrders) {
    console.log(`📊 Found ${pendingOrders.orders.length} pending orders`);
  }

  // 3. Get delivered orders
  console.log('\n3️⃣ Getting delivered orders:');
  const deliveredOrders = await getOrdersByStatus(GUEST_ID, 'delivered');
  if (deliveredOrders) {
    console.log(`📊 Found ${deliveredOrders.orders.length} delivered orders`);
  }

  // 4. Get orders with pagination
  console.log('\n4️⃣ Getting orders with pagination (page 1, limit 3):');
  const paginatedOrders = await getOrdersWithPagination(GUEST_ID, 1, 3);
  if (paginatedOrders) {
    console.log(`📊 Retrieved ${paginatedOrders.orders.length} orders from page 1`);
  }

  // 5. Get orders for specific store (if storeId is provided)
  const STORE_ID = '687505893fbf3098648bfe16'; // Replace with actual store ID
  console.log('\n5️⃣ Getting orders for specific store:');
  const storeOrders = await getOrdersByStore(GUEST_ID, STORE_ID);
  if (storeOrders) {
    console.log(`📊 Found ${storeOrders.orders.length} orders for store ${STORE_ID}`);
  }

  console.log('\n✅ Example completed successfully!');
}

/**
 * 7. Helper function to check if guest has orders
 */
async function checkGuestOrders(guestId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params: { limit: 1 }
    });
    
    const hasOrders = response.data.data.statistics.totalOrders > 0;
    console.log(`👤 Guest ${guestId} has ${response.data.data.statistics.totalOrders} orders`);
    return hasOrders;
  } catch (error) {
    console.error('❌ Error checking guest orders:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 8. Helper function to get guest spending statistics
 */
async function getGuestSpendingStats(guestId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/guest/${guestId}`, {
      params: { limit: 1 }
    });
    
    const stats = response.data.data.statistics;
    console.log('\n💰 Guest Spending Statistics:');
    console.log('=============================');
    console.log(`📦 Total Orders: ${stats.totalOrders}`);
    console.log(`💰 Total Spending: ${stats.totalSpending}`);
    console.log(`📈 Average Spending: ${stats.averageSpending}`);
    console.log(`📅 Last Order: ${stats.lastOrderDate}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting guest spending stats:', error.response?.data || error.message);
    return null;
  }
}

// Run example if file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = {
  getOrdersByGuestId,
  getOrdersByStatus,
  getOrdersByStore,
  getOrdersWithPagination,
  displayOrderInfo,
  checkGuestOrders,
  getGuestSpendingStats
};
