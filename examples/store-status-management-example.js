/**
 * Example: Store Status Management
 * 
 * This file demonstrates how the store status management system works
 * when subscriptions or trials expire.
 */

const BASE_URL = 'http://localhost:5001/api';

// Example 1: Check store status
async function checkStoreStatus(storeId) {
    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}/status`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Store Status:', result);
        return result;
    } catch (error) {
        console.error('Error checking store status:', error);
    }
}

// Example 2: Reactivate a store
async function reactivateStore(storeId) {
    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}/reactivate`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Store Reactivation:', result);
        return result;
    } catch (error) {
        console.error('Error reactivating store:', error);
    }
}

// Example 3: Manually trigger subscription check
async function triggerSubscriptionCheck() {
    try {
        const response = await fetch(`${BASE_URL}/subscription/check`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Subscription Check Result:', result);
        return result;
    } catch (error) {
        console.error('Error triggering subscription check:', error);
    }
}

// Example 4: Get deactivated stores
async function getDeactivatedStores() {
    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/deactivated`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Deactivated Stores:', result);
        return result;
    } catch (error) {
        console.error('Error getting deactivated stores:', error);
    }
}

// Example 5: Test store access with middleware
async function testStoreAccess(storeId) {
    try {
        // This would be a request to any store-specific endpoint
        const response = await fetch(`${BASE_URL}/products?storeId=${storeId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_STORE_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Store Access Test:', result);
        return result;
    } catch (error) {
        console.error('Error testing store access:', error);
    }
}

// Example 6: Simulate subscription expiry
async function simulateSubscriptionExpiry(storeId) {
    try {
        // This would typically be done by updating the database directly
        // or by setting a past date for the subscription end date
        console.log('To simulate subscription expiry:');
        console.log('1. Update the store\'s subscription.endDate to a past date');
        console.log('2. Call the subscription check endpoint');
        console.log('3. The store should be automatically deactivated');
        
        // Example database update (this would be done directly in MongoDB):
        /*
        db.stores.updateOne(
            { _id: ObjectId(storeId) },
            { 
                $set: { 
                    "subscription.endDate": new Date("2024-01-01"),
                    "subscription.isSubscribed": true 
                } 
            }
        );
        */
        
        // Then trigger the check
        await triggerSubscriptionCheck();
        
    } catch (error) {
        console.error('Error simulating subscription expiry:', error);
    }
}

// Example 7: Monitor store status changes
async function monitorStoreStatus(storeId) {
    try {
        console.log('Monitoring store status...');
        
        // Check initial status
        const initialStatus = await checkStoreStatus(storeId);
        console.log('Initial Status:', initialStatus.data.status);
        
        // Wait for a moment (simulating time passing)
        console.log('Waiting for status check...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check status again
        const updatedStatus = await checkStoreStatus(storeId);
        console.log('Updated Status:', updatedStatus.data.status);
        
        // If store was deactivated, reactivate it
        if (updatedStatus.data.status === 'inactive') {
            console.log('Store was deactivated, reactivating...');
            await reactivateStore(storeId);
        }
        
    } catch (error) {
        console.error('Error monitoring store status:', error);
    }
}

// Example 8: Get subscription history for a store
async function getStoreSubscriptionHistory(storeId) {
    try {
        const response = await fetch(`${BASE_URL}/subscription/stores/${storeId}/history`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('Subscription History:', result);
        return result;
    } catch (error) {
        console.error('Error getting subscription history:', error);
    }
}

// Example 9: Test automatic deactivation workflow
async function testAutomaticDeactivationWorkflow() {
    try {
        console.log('=== Testing Automatic Deactivation Workflow ===');
        
        // Step 1: Get all stores
        const response = await fetch(`${BASE_URL}/subscription/stores`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const stores = await response.json();
        console.log('Total stores:', stores.data.length);
        
        // Step 2: Find stores that might be expired
        const potentiallyExpired = stores.data.filter(store => 
            store.subscription.endDate && new Date(store.subscription.endDate) < new Date()
        );
        
        console.log('Potentially expired stores:', potentiallyExpired.length);
        
        // Step 3: Trigger subscription check
        console.log('Triggering subscription check...');
        await triggerSubscriptionCheck();
        
        // Step 4: Check deactivated stores
        const deactivated = await getDeactivatedStores();
        console.log('Deactivated stores after check:', deactivated.data.length);
        
        // Step 5: Reactivate one store as example
        if (deactivated.data.length > 0) {
            const storeToReactivate = deactivated.data[0];
            console.log('Reactivating store:', storeToReactivate.storeName);
            await reactivateStore(storeToReactivate.storeId);
        }
        
    } catch (error) {
        console.error('Error in automatic deactivation workflow:', error);
    }
}

// Example 10: Get system-wide subscription statistics
async function getSystemSubscriptionStats() {
    try {
        const response = await fetch(`${BASE_URL}/subscription/stats`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_SUPERADMIN_TOKEN'
            }
        });

        const result = await response.json();
        console.log('System Subscription Stats:', result);
        return result;
    } catch (error) {
        console.error('Error getting system stats:', error);
    }
}

module.exports = {
    checkStoreStatus,
    reactivateStore,
    triggerSubscriptionCheck,
    getDeactivatedStores,
    testStoreAccess,
    simulateSubscriptionExpiry,
    monitorStoreStatus,
    getStoreSubscriptionHistory,
    testAutomaticDeactivationWorkflow,
    getSystemSubscriptionStats
};

// Usage examples:
// 1. Check a specific store's status
// checkStoreStatus('507f1f77bcf86cd799439011');

// 2. Test the complete workflow
// testAutomaticDeactivationWorkflow();

// 3. Monitor a store's status changes
// monitorStoreStatus('507f1f77bcf86cd799439011');

// 4. Get system statistics
// getSystemSubscriptionStats();
