const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const SUPERADMIN_TOKEN = 'YOUR_SUPERADMIN_TOKEN_HERE'; // Replace with actual token

// Example subscription plans data
const samplePlans = [
  {
    name: "Free Trial",
    nameAr: "تجربة مجانية",
    description: "14-day free trial with basic features",
    descriptionAr: "تجربة مجانية لمدة 14 يوم مع الميزات الأساسية",
    type: "free",
    duration: 14,
    price: 0,
    currency: "USD",
    features: [
      {
        name: "Up to 10 Products",
        nameAr: "حتى 10 منتجات",
        description: "Add up to 10 products to your store",
        descriptionAr: "أضف حتى 10 منتجات لمتجرك",
        included: true
      },
      {
        name: "Basic Support",
        nameAr: "دعم أساسي",
        description: "Email support during business hours",
        descriptionAr: "دعم عبر البريد الإلكتروني خلال ساعات العمل",
        included: true
      }
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    maxProducts: 10,
    maxOrders: 50,
    maxUsers: 1,
    storageLimit: 100 // 100 MB
  },
  {
    name: "Starter Monthly",
    nameAr: "البداية الشهرية",
    description: "Perfect for small businesses starting their online journey",
    descriptionAr: "مثالي للشركات الصغيرة التي تبدأ رحلتها عبر الإنترنت",
    type: "monthly",
    duration: 30,
    price: 29.99,
    currency: "USD",
    features: [
      {
        name: "Up to 100 Products",
        nameAr: "حتى 100 منتج",
        description: "Add up to 100 products to your store",
        descriptionAr: "أضف حتى 100 منتج لمتجرك",
        included: true
      },
      {
        name: "Priority Support",
        nameAr: "دعم ذو أولوية",
        description: "24/7 email and chat support",
        descriptionAr: "دعم عبر البريد الإلكتروني والدردشة على مدار الساعة",
        included: true
      },
      {
        name: "Analytics Dashboard",
        nameAr: "لوحة تحليلات",
        description: "Basic sales and customer analytics",
        descriptionAr: "تحليلات أساسية للمبيعات والعملاء",
        included: true
      }
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 2,
    maxProducts: 100,
    maxOrders: 500,
    maxUsers: 3,
    storageLimit: 500 // 500 MB
  },
  {
    name: "Professional Monthly",
    nameAr: "المهني الشهري",
    description: "Advanced features for growing businesses",
    descriptionAr: "ميزات متقدمة للشركات النامية",
    type: "monthly",
    duration: 30,
    price: 79.99,
    currency: "USD",
    features: [
      {
        name: "Unlimited Products",
        nameAr: "منتجات غير محدودة",
        description: "Add unlimited products to your store",
        descriptionAr: "أضف منتجات غير محدودة لمتجرك",
        included: true
      },
      {
        name: "Advanced Analytics",
        nameAr: "تحليلات متقدمة",
        description: "Comprehensive business intelligence",
        descriptionAr: "ذكاء أعمال شامل",
        included: true
      },
      {
        name: "Multi-User Access",
        nameAr: "وصول متعدد المستخدمين",
        description: "Up to 10 team members",
        descriptionAr: "حتى 10 أعضاء في الفريق",
        included: true
      },
      {
        name: "API Access",
        nameAr: "وصول API",
        description: "Full API access for integrations",
        descriptionAr: "وصول كامل لـ API للتكاملات",
        included: true
      }
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 3,
    maxProducts: -1, // Unlimited
    maxOrders: -1, // Unlimited
    maxUsers: 10,
    storageLimit: 2000 // 2 GB
  },
  {
    name: "Enterprise Annual",
    nameAr: "المؤسسة السنوي",
    description: "Complete solution for large enterprises",
    descriptionAr: "حل كامل للمؤسسات الكبيرة",
    type: "annual",
    duration: 365,
    price: 999.99,
    currency: "USD",
    features: [
      {
        name: "Everything in Professional",
        nameAr: "كل شيء في المهني",
        description: "All Professional features included",
        descriptionAr: "جميع ميزات المهني مشمولة",
        included: true
      },
      {
        name: "Unlimited Everything",
        nameAr: "كل شيء غير محدود",
        description: "Unlimited products, orders, users, and storage",
        descriptionAr: "منتجات وطلبات ومستخدمين وتخزين غير محدود",
        included: true
      },
      {
        name: "Dedicated Support",
        nameAr: "دعم مخصص",
        description: "24/7 dedicated account manager",
        descriptionAr: "مدير حساب مخصص على مدار الساعة",
        included: true
      },
      {
        name: "Custom Integrations",
        nameAr: "تكاملات مخصصة",
        description: "Custom development and integrations",
        descriptionAr: "تطوير وتكاملات مخصصة",
        included: true
      }
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 4,
    maxProducts: -1, // Unlimited
    maxOrders: -1, // Unlimited
    maxUsers: -1, // Unlimited
    storageLimit: -1 // Unlimited
  }
];

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${SUPERADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Function to create sample plans
const createSamplePlans = async () => {
  console.log('🚀 Creating sample subscription plans...\n');

  const createdPlans = [];

  for (const planData of samplePlans) {
    try {
      const result = await makeAuthenticatedRequest('POST', '/subscription-plans', planData);
      console.log(`✅ Created plan: ${result.data.name} (${result.data.type})`);
      createdPlans.push(result.data);
    } catch (error) {
      console.error(`❌ Failed to create plan: ${planData.name}`);
    }
  }

  return createdPlans;
};

// Function to get all plans
const getAllPlans = async () => {
  console.log('\n📋 Getting all subscription plans...\n');
  
  try {
    const result = await makeAuthenticatedRequest('GET', '/subscription-plans');
    console.log(`Found ${result.data.length} plans:`);
    
    result.data.forEach(plan => {
      console.log(`- ${plan.name} (${plan.type}): ${plan.price} ${plan.currency}`);
    });
    
    return result.data;
  } catch (error) {
    console.error('Failed to get plans');
  }
};

// Function to get active plans (public)
const getActivePlans = async () => {
  console.log('\n🌐 Getting active plans for public display...\n');
  
  try {
    const result = await axios.get(`${API_BASE_URL}/subscription-plans/active`);
    console.log(`Found ${result.data.data.length} active plans:`);
    
    result.data.data.forEach(plan => {
      console.log(`- ${plan.name} (${plan.durationText}): ${plan.formattedPrice}`);
      if (plan.isPopular) {
        console.log('  ⭐ POPULAR PLAN');
      }
    });
    
    return result.data.data;
  } catch (error) {
    console.error('Failed to get active plans:', error.response?.data || error.message);
  }
};

// Function to get plan statistics
const getPlanStats = async () => {
  console.log('\n📊 Getting plan statistics...\n');
  
  try {
    const result = await makeAuthenticatedRequest('GET', '/subscription-plans/stats');
    console.log('Plan Statistics:');
    console.log(`- Total plans: ${result.data.total}`);
    console.log(`- Active plans: ${result.data.active}`);
    console.log(`- Inactive plans: ${result.data.inactive}`);
    console.log(`- Popular plans: ${result.data.popular}`);
    console.log('\nPlans by type:');
    Object.entries(result.data.byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    return result.data;
  } catch (error) {
    console.error('Failed to get plan stats');
  }
};

// Function to demonstrate plan management
const demonstratePlanManagement = async () => {
  console.log('\n🔧 Demonstrating plan management...\n');
  
  try {
    // Get all plans first
    const plans = await makeAuthenticatedRequest('GET', '/subscription-plans');
    
    if (plans.data.length > 0) {
      const firstPlan = plans.data[0];
      
      // Update a plan
      console.log(`Updating plan: ${firstPlan.name}`);
      const updateData = {
        description: `${firstPlan.description} (Updated)`,
        descriptionAr: `${firstPlan.descriptionAr} (محدث)`,
        isPopular: !firstPlan.isPopular
      };
      
      const updatedPlan = await makeAuthenticatedRequest('PUT', `/subscription-plans/${firstPlan._id}`, updateData);
      console.log(`✅ Updated plan: ${updatedPlan.data.name}`);
      
      // Toggle plan status
      console.log(`\nToggling plan status: ${updatedPlan.data.name}`);
      const toggledPlan = await makeAuthenticatedRequest('POST', `/subscription-plans/${updatedPlan.data._id}/toggle`);
      console.log(`✅ Plan ${toggledPlan.data.isActive ? 'activated' : 'deactivated'}: ${toggledPlan.data.name}`);
      
      return updatedPlan.data;
    }
  } catch (error) {
    console.error('Failed to demonstrate plan management');
  }
};

// Function to test subscription activation with plans
const testSubscriptionActivation = async () => {
  console.log('\n🔄 Testing subscription activation with plans...\n');
  
  try {
    // Get active plans
    const activePlans = await axios.get(`${API_BASE_URL}/subscription-plans/active`);
    
    if (activePlans.data.data.length > 0) {
      const plan = activePlans.data.data[0];
      const storeId = 'YOUR_STORE_ID_HERE'; // Replace with actual store ID
      
      console.log(`Activating subscription for store ${storeId} with plan: ${plan.name}`);
      
      const activationData = {
        planId: plan.id,
        paymentMethod: 'credit_card',
        autoRenew: true
      };
      
      const result = await makeAuthenticatedRequest('POST', `/subscription/stores/${storeId}`, activationData);
      console.log(`✅ Subscription activated: ${result.message}`);
      console.log(`Plan: ${result.data.plan.name}`);
      console.log(`Price: ${result.data.plan.price} ${result.data.plan.currency}`);
      console.log(`Duration: ${result.data.plan.duration} days`);
      
      return result.data;
    } else {
      console.log('No active plans found for testing');
    }
  } catch (error) {
    console.error('Failed to test subscription activation');
  }
};

// Main function to run all examples
const runExamples = async () => {
  console.log('🎯 Subscription Plans API Examples\n');
  console.log('=====================================\n');

  try {
    // Create sample plans
    await createSamplePlans();
    
    // Get all plans
    await getAllPlans();
    
    // Get active plans
    await getActivePlans();
    
    // Get plan statistics
    await getPlanStats();
    
    // Demonstrate plan management
    await demonstratePlanManagement();
    
    // Test subscription activation
    await testSubscriptionActivation();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Examples failed:', error.message);
  }
};

// Function to show API endpoints
const showAPIEndpoints = () => {
  console.log('\n📚 Available API Endpoints:\n');
  console.log('Subscription Plans Management:');
  console.log('POST   /api/subscription-plans                    - Create new plan');
  console.log('GET    /api/subscription-plans                    - Get all plans (with filters)');
  console.log('GET    /api/subscription-plans/active             - Get active plans (public)');
  console.log('GET    /api/subscription-plans/{planId}           - Get specific plan');
  console.log('PUT    /api/subscription-plans/{planId}           - Update plan');
  console.log('DELETE /api/subscription-plans/{planId}           - Delete plan');
  console.log('POST   /api/subscription-plans/{planId}/toggle    - Toggle plan status');
  console.log('POST   /api/subscription-plans/{planId}/popular   - Set plan as popular');
  console.log('GET    /api/subscription-plans/stats              - Get plan statistics');
  
  console.log('\nSubscription Management (Updated):');
  console.log('POST   /api/subscription/stores/{storeId}         - Activate subscription (now uses planId)');
  console.log('GET    /api/subscription/stores                   - Get all subscriptions');
  console.log('GET    /api/subscription/stores/{storeId}         - Get store subscription');
  console.log('PUT    /api/subscription/stores/{storeId}         - Update subscription');
  console.log('POST   /api/subscription/stores/{storeId}/trial   - Extend trial');
  console.log('POST   /api/subscription/stores/{storeId}/cancel  - Cancel subscription');
  console.log('GET    /api/subscription/stats                    - Get subscription statistics');
  console.log('GET    /api/subscription/expiring                 - Get expiring subscriptions');
  console.log('GET    /api/subscription/deactivated              - Get deactivated stores');
  console.log('POST   /api/subscription/trigger-check            - Trigger manual check');
  
  console.log('\nHistory & Analytics:');
  console.log('GET    /api/subscription/stores/{storeId}/history - Get store subscription history');
  console.log('GET    /api/subscription/stores/{storeId}/stats   - Get store subscription stats');
  console.log('GET    /api/subscription/activities               - Get all recent activities');
};

// Export functions for use in other files
module.exports = {
  createSamplePlans,
  getAllPlans,
  getActivePlans,
  getPlanStats,
  demonstratePlanManagement,
  testSubscriptionActivation,
  runExamples,
  showAPIEndpoints
};

// Run examples if this file is executed directly
if (require.main === module) {
  showAPIEndpoints();
  runExamples();
}
