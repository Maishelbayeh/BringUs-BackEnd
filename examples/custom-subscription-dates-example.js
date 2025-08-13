/**
 * Example: Custom Subscription Dates API Usage
 * 
 * This file demonstrates how to use the new custom start and end date functionality
 * for subscription plans, particularly for 'custom' type plans.
 */

const BASE_URL = 'http://localhost:5000/api';

// Example 1: Activate subscription with custom start and end dates
async function activateCustomSubscription() {
    const storeId = '507f1f77bcf86cd799439011';
    const planId = '507f1f77bcf86cd799439012'; // Custom plan ID
    
    const requestBody = {
        planId: planId,
        paymentMethod: 'credit_card',
        autoRenew: false,
        startDate: '2024-01-15T00:00:00.000Z', // Custom start date
        endDate: '2024-12-31T23:59:59.999Z'    // Custom end date
    };

    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Custom subscription activated:', result);
        return result;
    } catch (error) {
        console.error('Error activating custom subscription:', error);
    }
}

// Example 2: Activate subscription with only custom start date (end date calculated automatically)
async function activateWithCustomStartDate() {
    const storeId = '507f1f77bcf86cd799439011';
    const planId = '507f1f77bcf86cd799439012'; // Custom plan with 30 days duration
    
    const requestBody = {
        planId: planId,
        paymentMethod: 'paypal',
        autoRenew: true,
        startDate: '2024-02-01T00:00:00.000Z' // Only start date provided
        // endDate will be calculated automatically: startDate + plan.duration
    };

    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Subscription with custom start date:', result);
        return result;
    } catch (error) {
        console.error('Error activating subscription:', error);
    }
}

// Example 3: Activate subscription with only custom end date (start date calculated automatically)
async function activateWithCustomEndDate() {
    const storeId = '507f1f77bcf86cd799439011';
    const planId = '507f1f77bcf86cd799439012'; // Custom plan with 90 days duration
    
    const requestBody = {
        planId: planId,
        paymentMethod: 'bank_transfer',
        autoRenew: false,
        endDate: '2024-06-30T23:59:59.999Z' // Only end date provided
        // startDate will be calculated automatically: endDate - plan.duration
    };

    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Subscription with custom end date:', result);
        return result;
    } catch (error) {
        console.error('Error activating subscription:', error);
    }
}

// Example 4: Activate regular subscription (non-custom plan) - dates calculated automatically
async function activateRegularSubscription() {
    const storeId = '507f1f77bcf86cd799439011';
    const planId = '507f1f77bcf86cd799439013'; // Monthly plan
    
    const requestBody = {
        planId: planId,
        paymentMethod: 'credit_card',
        autoRenew: true
        // No custom dates - will use current date and calculate based on plan duration
    };

    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Regular subscription activated:', result);
        return result;
    } catch (error) {
        console.error('Error activating regular subscription:', error);
    }
}

// Example 5: Error case - Invalid date range (end date before start date)
async function testInvalidDateRange() {
    const storeId = '507f1f77bcf86cd799439011';
    const planId = '507f1f77bcf86cd799439012';
    
    const requestBody = {
        planId: planId,
        paymentMethod: 'credit_card',
        startDate: '2024-12-31T23:59:59.999Z', // End date
        endDate: '2024-01-01T00:00:00.000Z'    // Start date (invalid order)
    };

    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Invalid date range test result:', result);
        return result;
    } catch (error) {
        console.error('Error testing invalid date range:', error);
    }
}

// Example 6: Create a custom subscription plan first, then activate it
async function createAndActivateCustomPlan() {
    // First, create a custom subscription plan
    const planData = {
        name: "Custom 6-Month Plan",
        nameAr: "خطة مخصصة لستة أشهر",
        description: "A custom 6-month subscription plan",
        descriptionAr: "خطة اشتراك مخصصة لستة أشهر",
        type: "custom",
        duration: 180, // 6 months in days
        price: 299.99,
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
                name: "Priority Support",
                nameAr: "دعم ذو أولوية",
                description: "Get priority customer support",
                descriptionAr: "احصل على دعم العملاء ذو الأولوية",
                included: true
            }
        ],
        isActive: true,
        maxProducts: -1,
        maxOrders: -1,
        maxUsers: 10,
        storageLimit: 5000 // 5GB
    };

    try {
        // Create the custom plan
        const planResponse = await fetch(`${BASE_URL}/subscription-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            },
            body: JSON.stringify(planData)
        });

        const planResult = await planResponse.json();
        console.log('Custom plan created:', planResult);

        if (planResult.success) {
            // Now activate subscription with custom dates using the new plan
            const storeId = '507f1f77bcf86cd799439011';
            const subscriptionData = {
                planId: planResult.data._id,
                paymentMethod: 'credit_card',
                autoRenew: false,
                startDate: '2024-03-01T00:00:00.000Z',
                endDate: '2024-08-31T23:59:59.999Z'
            };

            const subscriptionResponse = await fetch(`${BASE_URL}/subscription/stores/${storeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
                },
                body: JSON.stringify(subscriptionData)
            });

            const subscriptionResult = await subscriptionResponse.json();
            console.log('Custom subscription activated:', subscriptionResult);
            return subscriptionResult;
        }
    } catch (error) {
        console.error('Error creating and activating custom plan:', error);
    }
}

// Export functions for use in other files
module.exports = {
    activateCustomSubscription,
    activateWithCustomStartDate,
    activateWithCustomEndDate,
    activateRegularSubscription,
    testInvalidDateRange,
    createAndActivateCustomPlan
};

// Example usage:
// const { activateCustomSubscription } = require('./examples/custom-subscription-dates-example.js');
// activateCustomSubscription();
