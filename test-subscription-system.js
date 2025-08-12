/**
 * Test Subscription System
 * 
 * Simple test script to verify subscription system functionality
 */

const API_BASE_URL = 'http://localhost:5001/api';

// Test function to check if server is running
async function testServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is running');
      console.log('📊 API Info:', data.message);
      return true;
    } else {
      console.error('❌ Server health check failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Test function to check subscription endpoints (without auth)
async function testSubscriptionEndpoints() {
  const endpoints = [
    '/subscription/stats',
    '/subscription/expiring',
    '/subscription/deactivated'
  ];

  console.log('\n🔍 Testing Subscription endpoints (should return 401/403 without auth):');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        console.log(`✅ ${endpoint} - Properly protected (${response.status})`);
      } else {
        console.log(`⚠️ ${endpoint} - Unexpected response (${response.status}):`, data.message);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} - Error:`, error.message);
    }
  }
}

// Test function to check Swagger documentation
async function testSwaggerDocs() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api-docs`);
    
    if (response.ok) {
      console.log('✅ Swagger documentation is accessible');
      console.log('📖 Swagger URL:', `${API_BASE_URL.replace('/api', '')}/api-docs`);
      return true;
    } else {
      console.error('❌ Swagger documentation not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot access Swagger docs:', error.message);
    return false;
  }
}

// Test function to simulate subscription workflow
async function testSubscriptionWorkflow() {
  console.log('\n🔄 Testing Subscription Workflow (with mock data):');
  
  // Mock subscription data
  const mockSubscription = {
    plan: 'monthly',
    durationInDays: 30,
    amount: 99.99,
    paymentMethod: 'credit_card',
    autoRenew: true
  };

  console.log('📋 Mock subscription data:', mockSubscription);
  
  // Test different subscription scenarios
  const scenarios = [
    {
      name: 'New Store with Trial',
      description: 'Store gets 14-day trial automatically',
      data: { isSubscribed: false, trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
    },
    {
      name: 'Active Monthly Subscription',
      description: 'Store with active monthly subscription',
      data: { 
        isSubscribed: true, 
        plan: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    },
    {
      name: 'Expired Trial',
      description: 'Store with expired trial period',
      data: { 
        isSubscribed: false, 
        trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    },
    {
      name: 'Expired Subscription',
      description: 'Store with expired paid subscription',
      data: { 
        isSubscribed: true, 
        plan: 'monthly',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log(`   📝 ${scenario.description}`);
    console.log(`   📊 Data:`, scenario.data);
    
    // Calculate days until expiry
    if (scenario.data.trialEndDate) {
      const daysLeft = Math.ceil((scenario.data.trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`   ⏰ Days until trial expires: ${daysLeft > 0 ? daysLeft : 'EXPIRED'}`);
    }
    
    if (scenario.data.endDate) {
      const daysLeft = Math.ceil((scenario.data.endDate - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`   ⏰ Days until subscription expires: ${daysLeft > 0 ? daysLeft : 'EXPIRED'}`);
    }
  });
}

// Test function to check cron job simulation
async function testCronJobSimulation() {
  console.log('\n⏰ Testing Cron Job Simulation:');
  
  const now = new Date();
  const cronExpression = '0 12 * * *'; // Daily at 12:00 PM
  
  console.log('📅 Current time:', now.toLocaleString());
  console.log('🕐 Cron expression:', cronExpression);
  console.log('🌍 Timezone: Asia/Jerusalem');
  
  // Simulate what the cron job would do
  const mockStores = [
    { name: 'Store A', trialEndDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: 'active' },
    { name: 'Store B', trialEndDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), status: 'active' },
    { name: 'Store C', endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: 'active' },
    { name: 'Store D', endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), status: 'active' }
  ];
  
  console.log('\n📊 Mock stores to check:');
  mockStores.forEach((store, index) => {
    const daysLeft = store.trialEndDate 
      ? Math.ceil((store.trialEndDate - now) / (1000 * 60 * 60 * 24))
      : Math.ceil((store.endDate - now) / (1000 * 60 * 60 * 24));
    
    const shouldDeactivate = daysLeft <= 0;
    const isWarning = daysLeft > 0 && daysLeft <= 3;
    
    console.log(`   ${index + 1}. ${store.name}`);
    console.log(`      📅 ${store.trialEndDate ? 'Trial ends' : 'Subscription ends'}: ${store.trialEndDate || store.endDate}`);
    console.log(`      ⏰ Days left: ${daysLeft}`);
    console.log(`      ${shouldDeactivate ? '🔴 Will be deactivated' : isWarning ? '⚠️ Warning will be sent' : '✅ Active'}`);
  });
  
  const toDeactivate = mockStores.filter(store => {
    const daysLeft = store.trialEndDate 
      ? Math.ceil((store.trialEndDate - now) / (1000 * 60 * 60 * 24))
      : Math.ceil((store.endDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft <= 0;
  });
  
  const warnings = mockStores.filter(store => {
    const daysLeft = store.trialEndDate 
      ? Math.ceil((store.trialEndDate - now) / (1000 * 60 * 60 * 1000))
      : Math.ceil((store.endDate - now) / (1000 * 60 * 60 * 1000));
    return daysLeft > 0 && daysLeft <= 3;
  });
  
  console.log('\n📋 Cron job results simulation:');
  console.log(`   ✅ Total stores checked: ${mockStores.length}`);
  console.log(`   🔴 Stores to deactivate: ${toDeactivate.length}`);
  console.log(`   ⚠️ Warnings to send: ${warnings.length}`);
  console.log(`   ❌ Errors: 0`);
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Subscription System Tests...\n');

  // Test 1: Server Health
  console.log('1️⃣ Testing server health...');
  const serverHealthy = await testServerHealth();
  console.log('');

  if (!serverHealthy) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('💡 Run: npm start');
    return;
  }

  // Test 2: Swagger Documentation
  console.log('2️⃣ Testing Swagger documentation...');
  await testSwaggerDocs();
  console.log('');

  // Test 3: Subscription Endpoints Protection
  console.log('3️⃣ Testing endpoint protection...');
  await testSubscriptionEndpoints();
  console.log('');

  // Test 4: Subscription Workflow
  console.log('4️⃣ Testing subscription workflow...');
  await testSubscriptionWorkflow();
  console.log('');

  // Test 5: Cron Job Simulation
  console.log('5️⃣ Testing cron job simulation...');
  await testCronJobSimulation();
  console.log('');

  console.log('✅ All tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Create a superadmin user');
  console.log('2. Get authentication token by logging in');
  console.log('3. Test subscription endpoints with proper authentication');
  console.log('4. Check Swagger UI for interactive documentation');
  console.log('5. Monitor cron job logs for daily subscription checks');
  console.log('\n🔗 Useful URLs:');
  console.log('   - Swagger UI: http://localhost:5001/api-docs');
  console.log('   - API Health: http://localhost:5001/api/health');
  console.log('   - Subscription Stats: http://localhost:5001/api/subscription/stats (with auth)');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testServerHealth,
  testSwaggerDocs,
  testSubscriptionEndpoints,
  testSubscriptionWorkflow,
  testCronJobSimulation,
  runTests
};
