// Test script to check API response structure
const axios = require('axios');

const testAPIResponse = async () => {
  try {
    console.log('🔍 Testing API Response Structure...\n');

    // Test GET products API
    const response = await axios.get('http://localhost:5000/api/meta/products?storeId=686a719956a82bfcc93a2e2d');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Total Products:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      const firstProduct = response.data.data[0];
      console.log('\n📦 First Product Structure:');
      console.log('ID:', firstProduct._id);
      console.log('Name:', firstProduct.nameEn);
      console.log('Colors:', JSON.stringify(firstProduct.colors, null, 2));
      console.log('Product Labels:', JSON.stringify(firstProduct.productLabels, null, 2));
      console.log('Specifications:', JSON.stringify(firstProduct.specifications, null, 2));
      
      // Check data types
      console.log('\n🔍 Data Type Analysis:');
      console.log('Colors is Array:', Array.isArray(firstProduct.colors));
      console.log('Product Labels is Array:', Array.isArray(firstProduct.productLabels));
      console.log('Specifications is Array:', Array.isArray(firstProduct.specifications));
      
      if (firstProduct.colors) {
        console.log('Colors length:', firstProduct.colors.length);
        firstProduct.colors.forEach((colorVariant, idx) => {
          console.log(`  Color variant ${idx}:`, Array.isArray(colorVariant) ? 'Array' : typeof colorVariant);
        });
      }
      
      if (firstProduct.productLabels) {
        console.log('Product Labels length:', firstProduct.productLabels.length);
        firstProduct.productLabels.forEach((label, idx) => {
          console.log(`  Label ${idx}:`, typeof label === 'object' ? 'Object' : typeof label);
        });
      }
      
      if (firstProduct.specifications) {
        console.log('Specifications length:', firstProduct.specifications.length);
        firstProduct.specifications.forEach((spec, idx) => {
          console.log(`  Specification ${idx}:`, typeof spec === 'object' ? 'Object' : typeof spec);
        });
      }
    } else {
      console.log('❌ No products found in response');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testAPIResponse(); 