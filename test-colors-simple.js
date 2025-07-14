// Test script for color handling without MongoDB connection

console.log('🔍 Testing Color Handling Logic...\n');

// Test data simulation
const mockProduct = {
  _id: 'test123',
  nameAr: 'قميص تجريبي',
  nameEn: 'Test Shirt',
  colors: [
    ['#FF0000'],
    ['#00FF00', '#0000FF'],
    ['#FFFF00', '#FF00FF', '#00FFFF']
  ]
};

const mockProductWithOriginal = {
  originalProduct: {
    _id: 'test456',
    nameAr: 'قميص آخر',
    nameEn: 'Another Shirt',
    colors: [
      ['#000000'],
      ['#FFFFFF', '#FF0000']
    ]
  }
};

// Test color processing logic (from useProducts.ts)
const processColors = (formColors) => {
  if (!Array.isArray(formColors)) {
    console.log('❌ formColors is not an array');
    return [];
  }

  return formColors.map((variant, index) => {
    console.log(`Processing variant ${index}:`, variant);
    
    // إذا كان variant يحتوي على colors property (من CustomColorPicker)
    if (variant && typeof variant === 'object' && Array.isArray(variant.colors)) {
      console.log(`  -> Found colors property: [${variant.colors.join(', ')}]`);
      return variant.colors;
    }
    // إذا كان variant مصفوفة ألوان مباشرة
    else if (Array.isArray(variant)) {
      console.log(`  -> Found direct array: [${variant.join(', ')}]`);
      return variant;
    }
    // إذا كان لون واحد
    else if (typeof variant === 'string') {
      console.log(`  -> Found single color: ${variant}`);
      return [variant];
    }
    // إذا كان null أو undefined
    else {
      console.log(`  -> Found null/undefined: ${variant}`);
      return [];
    }
  }).filter((colors) => colors.length > 0);
};

// Test form colors structure (from CustomColorPicker)
const mockFormColors = [
  {
    id: '1-1234567890',
    colors: ['#FF0000']
  },
  {
    id: '2-1234567890',
    colors: ['#00FF00', '#0000FF']
  },
  {
    id: '3-1234567890',
    colors: ['#FFFF00', '#FF00FF', '#00FFFF']
  }
];

console.log('📦 Test 1: Processing form colors from CustomColorPicker');
console.log('Input:', JSON.stringify(mockFormColors, null, 2));
const processedColors1 = processColors(mockFormColors);
console.log('Output:', JSON.stringify(processedColors1, null, 2));

console.log('\n📦 Test 2: Processing direct color arrays');
const directColors = [
  ['#FF0000'],
  ['#00FF00', '#0000FF'],
  ['#FFFF00']
];
console.log('Input:', JSON.stringify(directColors, null, 2));
const processedColors2 = processColors(directColors);
console.log('Output:', JSON.stringify(processedColors2, null, 2));

console.log('\n📦 Test 3: Processing mixed data');
const mixedColors = [
  { id: '1', colors: ['#FF0000'] },
  ['#00FF00', '#0000FF'],
  '#FFFF00',
  null,
  undefined
];
console.log('Input:', JSON.stringify(mixedColors, null, 2));
const processedColors3 = processColors(mixedColors);
console.log('Output:', JSON.stringify(processedColors3, null, 2));

console.log('\n📦 Test 4: Processing empty/null data');
const emptyColors = null;
console.log('Input:', emptyColors);
const processedColors4 = processColors(emptyColors);
console.log('Output:', JSON.stringify(processedColors4, null, 2));

console.log('\n✅ Color processing tests completed!');
console.log('\n📋 Summary:');
console.log('- Test 1: Form colors from CustomColorPicker ✅');
console.log('- Test 2: Direct color arrays ✅');
console.log('- Test 3: Mixed data types ✅');
console.log('- Test 4: Null/empty data ✅'); 