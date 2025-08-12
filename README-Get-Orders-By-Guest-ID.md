# Get Orders by Guest ID API

## Overview

The Get Orders by Guest ID API allows you to retrieve all orders for a specific guest user. This is useful for tracking guest user orders, analyzing their spending patterns, and managing their order history.

## API Endpoint

```http
GET /api/orders/guest/{guestId}
```

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guestId` | string | Yes | The guest ID to retrieve orders for |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination (minimum: 1) |
| `limit` | integer | No | 10 | Number of items per page (minimum: 1, maximum: 100) |
| `status` | string | No | - | Filter by order status (`pending`, `shipped`, `delivered`, `cancelled`) |
| `storeId` | string | No | - | Filter by store ID |

## Examples

### 1. Get all orders for a guest

```bash
curl -X GET "http://localhost:3000/api/orders/guest/guest_123456789"
```

### 2. Get orders with pagination

```bash
curl -X GET "http://localhost:3000/api/orders/guest/guest_123456789?page=1&limit=5"
```

### 3. Get orders by status

```bash
curl -X GET "http://localhost:3000/api/orders/guest/guest_123456789?status=pending"
```

### 4. Get orders for specific store

```bash
curl -X GET "http://localhost:3000/api/orders/guest/guest_123456789?storeId=687505893fbf3098648bfe16"
```

### 5. Get orders with multiple filters

```bash
curl -X GET "http://localhost:3000/api/orders/guest/guest_123456789?status=delivered&storeId=687505893fbf3098648bfe16&page=1&limit=10"
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": "ORD2412150001",
        "orderNumber": "ORD2412150001",
        "storeName": "Electronics Store",
        "storeId": "687505893fbf3098648bfe16",
        "storePhone": "+970599123456",
        "storeUrl": "/store/electronics-store",
        "currency": "USD",
        "price": 250.00,
        "status": "pending",
        "statusAr": "قيد المراجعة",
        "paymentStatus": "unpaid",
        "paymentStatusAr": "غير مدفوع",
        "createdAt": "2024-12-15T10:30:00.000Z",
        "updatedAt": "2024-12-15T10:30:00.000Z",
        "items": [
          {
            "id": "507f1f77bcf86cd799439011",
            "name": "Samsung Galaxy S22",
            "quantity": 1,
            "price": 250.00,
            "totalPrice": 250.00,
            "variant": {
              "name": "Color",
              "option": "Black"
            },
            "selectedSpecifications": [
              {
                "specificationId": "507f1f77bcf86cd799439012",
                "valueId": "507f1f77bcf86cd799439013",
                "valueAr": "128 جيجابايت",
                "valueEn": "128 GB",
                "titleAr": "السعة التخزينية",
                "titleEn": "Storage"
              }
            ],
            "selectedColors": ["#000000"]
          }
        ],
        "deliveryArea": {
          "locationAr": "الخليل",
          "locationEn": "Hebron",
          "price": 10.00,
          "estimatedDays": 2
        },
        "notes": {
          "customer": "Please deliver in the morning",
          "admin": null
        },
        "isGift": false,
        "affiliateTracking": {
          "isAffiliateOrder": false,
          "affiliateId": null,
          "referralSource": null,
          "commissionEarned": 0,
          "commissionPercentage": 0
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "statistics": {
      "totalOrders": 1,
      "totalSpending": 250.00,
      "averageSpending": 250.00,
      "lastOrderDate": "2024-12-15T10:30:00.000Z",
      "guestId": "guest_123456789"
    }
  }
}
```

### Error Responses

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Guest ID is required"
}
```

#### Server Error (500)

```json
{
  "success": false,
  "message": "Error retrieving orders",
  "error": "Database connection error"
}
```

## Response Fields

### Orders Array

Each order object contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Order number (same as orderNumber) |
| `orderNumber` | string | Unique order identifier |
| `storeName` | string | Store name in English |
| `storeId` | string | Store ID |
| `storePhone` | string | Store WhatsApp number |
| `storeUrl` | string | Store URL slug |
| `currency` | string | Order currency |
| `price` | number | Total order price |
| `status` | string | Order status (pending, shipped, delivered, cancelled) |
| `statusAr` | string | Order status in Arabic |
| `paymentStatus` | string | Payment status (unpaid, paid) |
| `paymentStatusAr` | string | Payment status in Arabic |
| `createdAt` | string | Order creation date |
| `updatedAt` | string | Order last update date |
| `items` | array | Array of order items |
| `deliveryArea` | object | Delivery area information |
| `notes` | object | Customer and admin notes |
| `isGift` | boolean | Whether order is a gift |
| `affiliateTracking` | object | Affiliate tracking information |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `currentPage` | integer | Current page number |
| `totalPages` | integer | Total number of pages |
| `totalItems` | integer | Total number of orders |
| `itemsPerPage` | integer | Number of items per page |
| `hasNextPage` | boolean | Whether there's a next page |
| `hasPrevPage` | boolean | Whether there's a previous page |

### Statistics Object

| Field | Type | Description |
|-------|------|-------------|
| `totalOrders` | integer | Total number of orders for this guest |
| `totalSpending` | number | Total amount spent by this guest |
| `averageSpending` | number | Average order value |
| `lastOrderDate` | string | Date of the most recent order |
| `guestId` | string | The guest ID |

## JavaScript Examples

### Using Axios

```javascript
const axios = require('axios');

// Get all orders for a guest
async function getGuestOrders(guestId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/orders/guest/${guestId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Get pending orders
async function getPendingOrders(guestId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/orders/guest/${guestId}`, {
      params: { status: 'pending' }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Get orders with pagination
async function getOrdersWithPagination(guestId, page = 1, limit = 10) {
  try {
    const response = await axios.get(`http://localhost:3000/api/orders/guest/${guestId}`, {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}
```

### Using Fetch

```javascript
// Get all orders for a guest
async function getGuestOrders(guestId) {
  try {
    const response = await fetch(`http://localhost:3000/api/orders/guest/${guestId}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Get orders with filters
async function getFilteredOrders(guestId, filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`http://localhost:3000/api/orders/guest/${guestId}?${params}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

## Use Cases

### 1. Guest Order History

```javascript
// Display guest order history
async function displayGuestHistory(guestId) {
  const orderData = await getGuestOrders(guestId);
  
  if (orderData && orderData.orders.length > 0) {
    console.log(`📦 Guest has ${orderData.statistics.totalOrders} orders`);
    console.log(`💰 Total spending: ${orderData.statistics.totalSpending}`);
    
    orderData.orders.forEach(order => {
      console.log(`Order ${order.orderNumber}: ${order.price} ${order.currency}`);
    });
  } else {
    console.log('No orders found for this guest');
  }
}
```

### 2. Guest Spending Analysis

```javascript
// Analyze guest spending patterns
async function analyzeGuestSpending(guestId) {
  const orderData = await getGuestOrders(guestId);
  
  if (orderData) {
    const stats = orderData.statistics;
    
    console.log('💰 Guest Spending Analysis:');
    console.log(`📦 Total Orders: ${stats.totalOrders}`);
    console.log(`💰 Total Spending: ${stats.totalSpending}`);
    console.log(`📈 Average Order Value: ${stats.averageSpending}`);
    console.log(`📅 Last Order: ${stats.lastOrderDate}`);
    
    // Calculate spending frequency
    if (stats.totalOrders > 1) {
      const firstOrder = orderData.orders[orderData.orders.length - 1];
      const timeSpan = new Date(stats.lastOrderDate) - new Date(firstOrder.createdAt);
      const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
      const frequency = daysSpan / (stats.totalOrders - 1);
      
      console.log(`📊 Average days between orders: ${frequency.toFixed(1)}`);
    }
  }
}
```

### 3. Guest Order Status Tracking

```javascript
// Track order statuses for a guest
async function trackGuestOrderStatuses(guestId) {
  const statuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  const statusCounts = {};
  
  for (const status of statuses) {
    const orderData = await getFilteredOrders(guestId, { status });
    statusCounts[status] = orderData ? orderData.orders.length : 0;
  }
  
  console.log('📊 Guest Order Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`${status}: ${count} orders`);
  });
}
```

## Running the Example

You can run the provided example to test the API:

```bash
node examples/get-orders-by-guest-id-example.js
```

Make sure to:
1. Replace `GUEST_ID` with an actual guest ID from your database
2. Update `API_BASE_URL` if your server runs on a different port
3. Ensure your server is running and accessible

## Notes

- The API returns orders sorted by creation date (newest first)
- Guest IDs are typically generated when guests create their first order
- The API supports filtering by store ID for multi-store applications
- All monetary values are returned as numbers
- Dates are returned in ISO 8601 format
- The API includes comprehensive statistics for guest spending analysis
