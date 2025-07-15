const axios = require('axios');

// Test the new product labels API endpoint
async function testProductLabelsAPI() {
  const baseURL = 'http://localhost:3000/api/meta';
  const storeId = '687505893fbf3098648bfe16';
  
  try {
    console.log('Testing Product Labels API...\n');
    
    // Test 1: Get all product labels
    console.log('1. Testing GET /product-labels (all labels):');
    try {
      const response1 = await axios.get(`${baseURL}/product-labels`);
      console.log('✅ Success:', response1.data.length, 'labels found');
      console.log('Sample data:', response1.data.slice(0, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Get product labels by store ID
    console.log('2. Testing GET /stores/:storeId/product-labels:');
    try {
      const response2 = await axios.get(`${baseURL}/stores/${storeId}/product-labels`);
      console.log('✅ Success:', response2.data.length, 'labels found for store', storeId);
      console.log('Sample data:', response2.data.slice(0, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Create a new product label
    console.log('3. Testing POST /product-labels (create new label):');
    const newLabel = {
      nameAr: 'تست',
      nameEn: 'Test',
      descriptionAr: 'تسمية تجريبية',
      descriptionEn: 'Test label',
      isActive: true,
      sortOrder: 9,
      store: storeId
    };
    
    try {
      const response3 = await axios.post(`${baseURL}/product-labels`, newLabel);
      console.log('✅ Success: Created new label with ID:', response3.data._id);
      console.log('Created data:', response3.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testProductLabelsAPI(); 