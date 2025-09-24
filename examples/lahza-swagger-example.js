/**
 * Lahza Payment API - Swagger UI Example
 * 
 * Use this example data in Swagger UI at: http://localhost:5001/api-docs
 * 
 * Endpoint: POST /api/lahza-payment/{storeId}/initialize
 * Store ID: 687c9bb0a7b3f2a0831c4675
 */

// Example 1: Basic Payment (Arabic)
const basicPaymentExample = {
  "amount": 100.50,
  "currency": "ILS",
  "email": "customer@example.com",
  "customerName": "أحمد محمد",
  "customerPhone": "+972501234567",
  "description": "دفع مقابل طلب #12345",
  "metadata": {
    "orderId": "12345",
    "userId": "687c9c02a7b3f2a0831c46be",
    "productIds": ["abc123", "def456"]
  }
};

// Example 2: USD Payment (English)
const usdPaymentExample = {
  "amount": 99.99,
  "currency": "USD",
  "email": "moon95@gmail.com",
  "customerName": "John Smith",
  "customerPhone": "+1234567890",
  "description": "Payment for order #67890",
  "metadata": {
    "orderId": "67890",
    "userId": "user123",
    "source": "mobile_app"
  }
};

// Example 3: Minimal Required Data
const minimalPaymentExample = {
  "amount": 50.00,
  "currency": "ILS",
  "email": "test@example.com",
  "customerName": "Test User"
};

// Example 4: With Complex Metadata
const complexMetadataExample = {
  "amount": 250.75,
  "currency": "ILS",
  "email": "customer@store.com",
  "customerName": "محمد أحمد علي",
  "customerPhone": "+972501234567",
  "description": "دفع مقابل طلب متعدد المنتجات",
  "metadata": {
    "orderId": "ORDER-54321",
    "userId": "USER-456",
    "items": [
      {
        "productId": "prod1",
        "quantity": 2,
        "price": 100.00
      },
      {
        "productId": "prod2", 
        "quantity": 1,
        "price": 50.75
      }
    ],
    "shippingAddress": {
      "city": "رام الله",
      "street": "شارع الملك فيصل"
    },
    "paymentMethod": "lahza",
    "source": "website"
  }
};

console.log('📋 Lahza Payment API Examples:');
console.log('\n1️⃣ Basic Payment (Arabic):');
console.log(JSON.stringify(basicPaymentExample, null, 2));

console.log('\n2️⃣ USD Payment (English):');
console.log(JSON.stringify(usdPaymentExample, null, 2));

console.log('\n3️⃣ Minimal Required Data:');
console.log(JSON.stringify(minimalPaymentExample, null, 2));

console.log('\n4️⃣ Complex Metadata:');
console.log(JSON.stringify(complexMetadataExample, null, 2));

console.log('\n🔗 Swagger UI URL: http://localhost:5001/api-docs');
console.log('📍 Endpoint: POST /api/lahza-payment/687c9bb0a7b3f2a0831c4675/initialize');

module.exports = {
  basicPaymentExample,
  usdPaymentExample,
  minimalPaymentExample,
  complexMetadataExample
};
