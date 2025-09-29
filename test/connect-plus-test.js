const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';

/**
 * Test Connect Plus API endpoints
 */
async function testConnectPlusAPI() {
  console.log('🧪 Starting Connect Plus API Tests...\n');

  try {
    // Test 1: Test Connection
    console.log('1️⃣ Testing Connect Plus Connection...');
    try {
      const connectionResponse = await axios.get(`${BASE_URL}/connect-plus/test-connection`);
      console.log('✅ Connection Test:', connectionResponse.data);
    } catch (error) {
      console.log('❌ Connection Test Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get Area and Sub Area
    console.log('2️⃣ Testing Get Area and Sub Area...');
    try {
      const areaResponse = await axios.get(`${BASE_URL}/connect-plus/get-area-sub-area?code=PS`);
      console.log('✅ Area and Sub Area:', areaResponse.data);
    } catch (error) {
      console.log('❌ Area and Sub Area Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get Products
    console.log('3️⃣ Testing Get Products...');
    try {
      const productsResponse = await axios.post(`${BASE_URL}/connect-plus/get-products`, {
        size: 10,
        filters: []
      });
      console.log('✅ Products:', productsResponse.data);
    } catch (error) {
      console.log('❌ Products Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get Variants
    console.log('4️⃣ Testing Get Variants...');
    try {
      const variantsResponse = await axios.post(`${BASE_URL}/connect-plus/get-variants`, {
        size: 10,
        filters: []
      });
      console.log('✅ Variants:', variantsResponse.data);
    } catch (error) {
      console.log('❌ Variants Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Get Delivery Companies
    console.log('5️⃣ Testing Get Delivery Companies...');
    try {
      const companiesResponse = await axios.post(`${BASE_URL}/connect-plus/get-delivery-companies`, {
        size: 10,
        filters: []
      });
      console.log('✅ Delivery Companies:', companiesResponse.data);
    } catch (error) {
      console.log('❌ Delivery Companies Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Get Delivery Fee
    console.log('6️⃣ Testing Get Delivery Fee...');
    try {
      const feeResponse = await axios.post(`${BASE_URL}/connect-plus/get-delivery-fee`, {
        connection: 245,
        area: 10
      });
      console.log('✅ Delivery Fee:', feeResponse.data);
    } catch (error) {
      console.log('❌ Delivery Fee Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 7: Add Orders
    console.log('7️⃣ Testing Add Orders...');
    try {
      const ordersData = {
        orders_list: [
          {
            address: "test address",
            customer_mobile: "0595215291",
            customer_name: "Customer Name",
            area: "الخليل",
            connection: 245,
            sub_area: "الظاهرية",
            country: "PS",
            country_code: "+972",
            note: "note",
            order_reference: "abcd1241",
            product_info: "product_info",
            package_cost: 598,
            total_cod: "638",
            payment_method: "",
            order_lines: [
              {
                id: "",
                product_variant: 458,
                quantity: 1,
                price: "15.00",
                total_price: "15.00"
              },
              {
                id: "",
                product_variant: 456,
                quantity: 1,
                price: "12.00",
                total_price: "12.00"
              }
            ]
          }
        ]
      };

      const ordersResponse = await axios.post(`${BASE_URL}/connect-plus/add-orders`, ordersData);
      console.log('✅ Add Orders:', ordersResponse.data);
    } catch (error) {
      console.log('❌ Add Orders Failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }

  console.log('\n🏁 Connect Plus API Tests Completed!');
}

/**
 * Generate curl commands for testing
 */
function generateCurlCommands() {
  console.log('📋 Curl Commands for Connect Plus API:\n');

  console.log('1️⃣ Test Connection:');
  console.log(`curl -X 'GET' \\
  '${BASE_URL}/connect-plus/test-connection' \\
  -H 'accept: application/json'`);

  console.log('\n2️⃣ Get Area and Sub Area:');
  console.log(`curl -X 'GET' \\
  '${BASE_URL}/connect-plus/get-area-sub-area?code=PS' \\
  -H 'accept: application/json'`);

  console.log('\n3️⃣ Get Products:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/connect-plus/get-products' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "size": 30,
    "filters": []
  }'`);

  console.log('\n4️⃣ Get Variants:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/connect-plus/get-variants' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "size": 30,
    "filters": []
  }'`);

  console.log('\n5️⃣ Get Delivery Companies:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/connect-plus/get-delivery-companies' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "size": 30,
    "filters": []
  }'`);

  console.log('\n6️⃣ Get Delivery Fee:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/connect-plus/get-delivery-fee' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "connection": 245,
    "area": 10
  }'`);

  console.log('\n7️⃣ Add Orders:');
  console.log(`curl -X 'POST' \\
  '${BASE_URL}/connect-plus/add-orders' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "orders_list": [
      {
        "address": "test address",
        "customer_mobile": "0595215291",
        "customer_name": "Customer Name",
        "area": "الخليل",
        "connection": 245,
        "sub_area": "الظاهرية",
        "country": "PS",
        "country_code": "+972",
        "note": "note",
        "order_reference": "abcd1241",
        "product_info": "product_info",
        "package_cost": 598,
        "total_cod": "638",
        "payment_method": "",
        "order_lines": [
          {
            "id": "",
            "product_variant": 458,
            "quantity": 1,
            "price": "15.00",
            "total_price": "15.00"
          }
        ]
      }
    ]
  }'`);
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Connect Plus API Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  generateCurlCommands();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  testConnectPlusAPI()
    .then(() => {
      console.log('\n✅ All tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
    });
}

module.exports = {
  testConnectPlusAPI,
  generateCurlCommands
};
