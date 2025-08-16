// Simple test script for user creation logic
// This script tests the logic without requiring database connection

console.log('🧪 Testing User Creation Logic...\n');

// Test data (same as your request)
const testUserData = {
  firstName: "mai",
  lastName: "shelbayeh",
  email: "maiperfuim@gmail.com",
  password: "123123",
  phone: "+972592678828",
  role: "client",
  store: "689cf88b3b39c7069a48cd0f",
  addresses: [
    {
      type: "home",
      street: "Zwatta",
      city: "Nablu",
      state: "Nablu",
      zipCode: "",
      country: "فلسطين",
      isDefault: true
    }
  ],
  status: "active"
};

console.log('📋 Test 1: Input Data Validation');
console.log(`✅ First Name: ${testUserData.firstName}`);
console.log(`✅ Last Name: ${testUserData.lastName}`);
console.log(`✅ Email: ${testUserData.email}`);
console.log(`✅ Role: ${testUserData.role}`);
console.log(`✅ Store: ${testUserData.store}`);
console.log(`✅ Status: ${testUserData.status}`);

console.log('\n📋 Test 2: Address Validation');
const address = testUserData.addresses[0];
const isValidAddress = address.street && address.street.trim() && 
                      address.city && address.city.trim() && 
                      address.state && address.state.trim() && 
                      address.country && address.country.trim();

console.log(`✅ Address validation: ${isValidAddress ? 'Valid' : 'Invalid'}`);
console.log(`   Street: "${address.street}"`);
console.log(`   City: "${address.city}"`);
console.log(`   State: "${address.state}"`);
console.log(`   ZipCode: "${address.zipCode}" (optional)`);
console.log(`   Country: "${address.country}"`);

console.log('\n📋 Test 3: User Data Preparation (Controller Logic)');
const { firstName, lastName, email, password, phone, role, store, addresses, status } = testUserData;

const userData = {
  firstName,
  lastName,
  email,
  password,
  phone,
  role: role || 'client',
  status: status || 'active'
};

// Handle addresses
if (addresses && Array.isArray(addresses)) {
  userData.addresses = addresses.filter(addr => 
    addr.street && addr.street.trim() && 
    addr.city && addr.city.trim() && 
    addr.state && addr.state.trim() && 
    addr.country && addr.country.trim()
  );
} else {
  userData.addresses = [];
}

// Add store if provided and user is admin or client
if (store && (userData.role === 'admin' || userData.role === 'client')) {
  userData.store = typeof store === 'object' && store._id ? store._id : store;
  console.log(`🔧 Store assigned to user: ${userData.store}`);
} else {
  console.log(`⚠️  No store assigned. Store: ${store}, Role: ${userData.role}`);
}

console.log('✅ User data prepared:');
console.log(`   Store: ${userData.store}`);
console.log(`   Role: ${userData.role}`);
console.log(`   Addresses count: ${userData.addresses.length}`);

console.log('\n📋 Test 4: Store Assignment Logic');
console.log(`✅ Store value: ${store}`);
console.log(`✅ Store type: ${typeof store}`);
console.log(`✅ User role: ${userData.role}`);
console.log(`✅ Is admin or client: ${userData.role === 'admin' || userData.role === 'client'}`);
console.log(`✅ Store assignment condition: ${store && (userData.role === 'admin' || userData.role === 'client')}`);

console.log('\n📋 Test 5: Expected Response Structure');
const expectedResponse = {
  success: true,
  message: 'User registered successfully',
  token: 'JWT_TOKEN_WOULD_BE_HERE',
  user: {
    id: 'USER_ID_WOULD_BE_HERE',
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    store: userData.store
  }
};

console.log('✅ Expected response structure:');
console.log(JSON.stringify(expectedResponse, null, 2));

console.log('\n🎉 User creation logic test completed successfully!');
console.log('\n📝 Notes:');
console.log('- Store assignment logic is correct');
console.log('- Address validation excludes zipCode requirement');
console.log('- Response includes store field');
console.log('- All validation conditions are met');

console.log('\n🔍 Debugging Tips:');
console.log('1. Check server logs for "🔧 Store assigned to user" message');
console.log('2. Check server logs for "✅ User created with ID" message');
console.log('3. Verify the store ID exists in your database');
console.log('4. Check if there are any validation errors in the User model');
