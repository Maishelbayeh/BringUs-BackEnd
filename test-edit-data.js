// Test script to check edit data structure
const axios = require('axios');

const testEditData = async () => {
  try {
    console.log('🔍 Testing Edit Data Structure...\n');

    // Test GET products API
    const response = await axios.get('http://localhost:5000/api/meta/products?storeId=686a719956a82bfcc93a2e2d');
    
    if (response.data.data && response.data.data.length > 0) {
      const firstProduct = response.data.data[0];
      console.log('📦 First Product Data:');
      console.log('ID:', firstProduct._id);
      console.log('Name:', firstProduct.nameEn);
      console.log('Colors:', JSON.stringify(firstProduct.colors, null, 2));
      console.log('Product Labels:', JSON.stringify(firstProduct.productLabels, null, 2));
      console.log('Specifications:', JSON.stringify(firstProduct.specifications, null, 2));
      
      // Simulate the edit process
      console.log('\n🔄 Simulating Edit Process...');
      
      // Simulate tableData structure
      const tableItem = {
        id: firstProduct._id,
        nameAr: firstProduct.nameAr,
        nameEn: firstProduct.nameEn,
        colors: firstProduct.colors?.length || 0,
        originalProduct: firstProduct
      };
      
      console.log('📊 Table Item Structure:');
      console.log('Table Item Colors:', tableItem.colors);
      console.log('Original Product Colors:', JSON.stringify(tableItem.originalProduct.colors, null, 2));
      
      // Simulate handleEdit logic
      const originalProduct = tableItem.originalProduct || tableItem;
      const productColors = originalProduct.colors || [];
      const formColors = Array.isArray(productColors) && productColors.length > 0
        ? productColors.map((arr, idx) => ({
            id: String(idx) + '-' + Date.now(),
            colors: arr
          }))
        : [];
      
      console.log('\n🎨 Form Colors Result:');
      console.log('Input Colors:', JSON.stringify(productColors, null, 2));
      console.log('Form Colors:', JSON.stringify(formColors, null, 2));
      
      // Test product labels
      const productLabels = originalProduct.productLabels || [];
      const productLabelIds = Array.isArray(productLabels) && productLabels.length > 0
        ? productLabels.map((label) => {
            if (typeof label === 'object' && label._id) {
              return label._id;
            } else {
              return label;
            }
          })
        : [];
      
      console.log('\n🏷️ Product Labels Result:');
      console.log('Input Labels:', JSON.stringify(productLabels, null, 2));
      console.log('Label IDs:', JSON.stringify(productLabelIds, null, 2));
      
      // Test specifications
      const specifications = originalProduct.specifications || [];
      const specificationIds = Array.isArray(specifications) && specifications.length > 0
        ? specifications.map((spec) => {
            if (typeof spec === 'object' && spec._id) {
              return spec._id;
            } else {
              return spec;
            }
          })
        : [];
      
      console.log('\n📋 Specifications Result:');
      console.log('Input Specs:', JSON.stringify(specifications, null, 2));
      console.log('Spec IDs:', JSON.stringify(specificationIds, null, 2));
      
    } else {
      console.log('❌ No products found in response');
    }

  } catch (error) {
    console.error('❌ Error testing edit data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testEditData(); 