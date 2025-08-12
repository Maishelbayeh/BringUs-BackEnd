const Store = require('../Models/Store');
const cron = require('node-cron');

class SubscriptionService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Check and update store subscription status
   * This method runs daily at 12:00 PM
   */
  async checkSubscriptionStatus() {
    if (this.isRunning) {
      console.log('⚠️ Subscription check already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting daily subscription status check...');

    try {
      const now = new Date();
      const results = {
        checked: 0,
        deactivated: 0,
        warnings: 0,
        errors: 0,
        details: []
      };

      // 1. Find stores that should be deactivated
      const storesToDeactivate = await Store.find({
        $or: [
          // Stores with expired trial (not subscribed and trial ended)
          {
            'subscription.isSubscribed': false,
            'subscription.trialEndDate': { $lt: now },
            status: { $ne: 'inactive' }
          },
          // Stores with expired subscription
          {
            'subscription.isSubscribed': true,
            'subscription.endDate': { $lt: now },
            status: { $ne: 'inactive' }
          }
        ]
      });

      console.log(`📊 Found ${storesToDeactivate.length} stores to deactivate`);

      // 2. Deactivate stores
      for (const store of storesToDeactivate) {
        try {
          const oldStatus = store.status;
          store.status = 'inactive';
          await store.save();

          results.deactivated++;
          results.details.push({
            storeId: store._id,
            storeName: store.nameEn,
            action: 'deactivated',
            reason: store.subscription.isSubscribed ? 'subscription_expired' : 'trial_expired',
            oldStatus,
            newStatus: 'inactive'
          });

          console.log(`🔴 Deactivated store: ${store.nameEn} (${store._id})`);
        } catch (error) {
          console.error(`❌ Error deactivating store ${store._id}:`, error.message);
          results.errors++;
        }
      }

      // 3. Find stores with expiring subscriptions (within 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringStores = await Store.find({
        $or: [
          // Trial expiring within 3 days
          {
            'subscription.isSubscribed': false,
            'subscription.trialEndDate': { 
              $gte: now, 
              $lte: threeDaysFromNow 
            },
            status: 'active'
          },
          // Subscription expiring within 3 days
          {
            'subscription.isSubscribed': true,
            'subscription.endDate': { 
              $gte: now, 
              $lte: threeDaysFromNow 
            },
            status: 'active'
          }
        ]
      });

      console.log(`⚠️ Found ${expiringStores.length} stores with expiring subscriptions`);

      // 4. Log warnings for expiring stores
      for (const store of expiringStores) {
        const daysLeft = store.subscription.isSubscribed 
          ? store.daysUntilSubscriptionExpires 
          : store.daysUntilTrialExpires;

        results.warnings++;
        results.details.push({
          storeId: store._id,
          storeName: store.nameEn,
          action: 'warning',
          reason: 'expiring_soon',
          daysLeft,
          type: store.subscription.isSubscribed ? 'subscription' : 'trial'
        });

        console.log(`⚠️ Store expiring soon: ${store.nameEn} - ${daysLeft} days left`);
      }

      // 5. Get total count of checked stores
      const totalStores = await Store.countDocuments();
      results.checked = totalStores;

      // 6. Log summary
      console.log('📋 Subscription check completed:');
      console.log(`   ✅ Total stores checked: ${results.checked}`);
      console.log(`   🔴 Stores deactivated: ${results.deactivated}`);
      console.log(`   ⚠️ Warnings generated: ${results.warnings}`);
      console.log(`   ❌ Errors encountered: ${results.errors}`);

      // 7. Send notifications (you can implement this later)
      await this.sendNotifications(results);

      return results;

    } catch (error) {
      console.error('❌ Error in subscription check:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send notifications to store owners about their subscription status
   */
  async sendNotifications(results) {
    // TODO: Implement notification system
    // This could include:
    // - Email notifications
    // - SMS notifications
    // - Push notifications
    // - Dashboard alerts
    
    console.log('📧 Notifications would be sent here...');
    
    // Example implementation:
    for (const detail of results.details) {
      if (detail.action === 'deactivated') {
        // Send deactivation notification
        console.log(`📧 Sending deactivation notification to ${detail.storeName}`);
      } else if (detail.action === 'warning') {
        // Send expiration warning
        console.log(`📧 Sending expiration warning to ${detail.storeName} (${detail.daysLeft} days left)`);
      }
    }
  }

  /**
   * Manually check a specific store's subscription status
   */
  async checkStoreSubscription(storeId) {
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const shouldDeactivate = store.shouldBeDeactivated();
      const isActive = store.isSubscriptionActive;
      const daysUntilExpiry = store.subscription.isSubscribed 
        ? store.daysUntilSubscriptionExpires 
        : store.daysUntilTrialExpires;

      return {
        storeId: store._id,
        storeName: store.nameEn,
        isSubscriptionActive: isActive,
        shouldBeDeactivated: shouldDeactivate,
        daysUntilExpiry,
        subscription: store.subscription,
        status: store.status
      };
    } catch (error) {
      console.error('Error checking store subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    try {
      const now = new Date();
      
      const stats = {
        total: await Store.countDocuments(),
        active: await Store.countDocuments({ status: 'active' }),
        inactive: await Store.countDocuments({ status: 'inactive' }),
        suspended: await Store.countDocuments({ status: 'suspended' }),
        subscribed: await Store.countDocuments({ 'subscription.isSubscribed': true }),
        trial: await Store.countDocuments({ 'subscription.isSubscribed': false }),
        expiringToday: await Store.countDocuments({
          $or: [
            {
              'subscription.isSubscribed': false,
              'subscription.trialEndDate': {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
              }
            },
            {
              'subscription.isSubscribed': true,
              'subscription.endDate': {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
              }
            }
          ]
        }),
        expiringThisWeek: await Store.countDocuments({
          $or: [
            {
              'subscription.isSubscribed': false,
              'subscription.trialEndDate': {
                $gte: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              }
            },
            {
              'subscription.isSubscribed': true,
              'subscription.endDate': {
                $gte: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              }
            }
          ]
        })
      };

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  /**
   * Start the cron job
   */
  startCronJob() {
    // Run every day at 12:00 PM
    cron.schedule('0 12 * * *', async () => {
      console.log('⏰ Daily subscription check triggered by cron job');
      await this.checkSubscriptionStatus();
    }, {
      scheduled: true,
      timezone: "Asia/Jerusalem" // Adjust timezone as needed
    });

    console.log('✅ Subscription cron job started (daily at 12:00 PM)');
  }

  /**
   * Stop the cron job
   */
  stopCronJob() {
    // This would require storing the cron job reference
    console.log('⏹️ Subscription cron job stopped');
  }
}

module.exports = new SubscriptionService();
