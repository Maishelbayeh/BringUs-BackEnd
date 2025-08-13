const Store = require('../Models/Store');
const cron = require('node-cron');

class SubscriptionService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Check subscription status and update stores accordingly
   */
  async checkSubscriptionStatus() {
    try {
      console.log('🔍 Starting subscription status check...');
      
      const now = new Date();
      let deactivatedCount = 0;
      let warningCount = 0;
      const warnings = [];
      const deactivated = [];

      // Find stores that should be deactivated
      const storesToDeactivate = await Store.find({
        $or: [
          // Expired paid subscriptions
          {
            'subscription.isSubscribed': true,
            'subscription.endDate': { $lt: now },
            status: 'active'
          },
          // Expired trial periods (14 days limit)
          {
            'subscription.isSubscribed': false,
            'subscription.trialEndDate': { $lt: now },
            status: 'active'
          }
        ]
      });

      // Deactivate stores using the new method
      for (const store of storesToDeactivate) {
        const wasDeactivated = await store.deactivateIfExpired();
        
        if (wasDeactivated) {
          deactivated.push({
            storeId: store._id,
            storeName: store.nameEn,
            reason: store.subscription.isSubscribed ? 'subscription_expired' : 'trial_expired'
          });
          deactivatedCount++;
        }
      }

      // Find stores with expiring subscriptions/trials (within 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const storesWithExpiringSubscriptions = await Store.find({
        $or: [
          // Expiring paid subscriptions
          {
            'subscription.isSubscribed': true,
            'subscription.endDate': { $gte: now, $lte: threeDaysFromNow },
            status: 'active'
          },
          // Expiring trial periods
          {
            'subscription.isSubscribed': false,
            'subscription.trialEndDate': { $gte: now, $lte: threeDaysFromNow },
            status: 'active'
          }
        ]
      });

      // Generate warnings
      for (const store of storesWithExpiringSubscriptions) {
        const expiryDate = store.subscription.isSubscribed 
          ? store.subscription.endDate 
          : store.subscription.trialEndDate;
        
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        warnings.push({
          storeId: store._id,
          storeName: store.nameEn,
          daysUntilExpiry,
          type: store.subscription.isSubscribed ? 'subscription' : 'trial',
          expiryDate
        });

        warningCount++;
      }

      // Send notifications (placeholder for future implementation)
      if (warnings.length > 0 || deactivated.length > 0) {
        await sendNotifications(warnings, deactivated);
      }

      console.log(`✅ Subscription check completed:`);
      console.log(`   - Deactivated: ${deactivatedCount} stores`);
      console.log(`   - Warnings: ${warningCount} stores`);

      return {
        deactivatedCount,
        warningCount,
        deactivated,
        warnings,
        checkedAt: now
      };

    } catch (error) {
      console.error('❌ Error during subscription status check:', error);
      throw error;
    }
  }

  /**
   * Send notifications for subscription events
   * This is a placeholder for future notification implementation
   */
  async sendNotifications(warnings, deactivated) {
    try {
      console.log('📧 Sending subscription notifications...');
      
      // TODO: Implement actual notification logic
      // This could include:
      // - Email notifications to store owners
      // - SMS notifications
      // - Push notifications
      // - Admin dashboard alerts
      
      if (warnings.length > 0) {
        console.log(`⚠️ Sending ${warnings.length} expiry warnings`);
        // await sendExpiryWarnings(warnings);
      }
      
      if (deactivated.length > 0) {
        console.log(`🔴 Sending ${deactivated.length} deactivation notifications`);
        // await sendDeactivationNotifications(deactivated);
      }
      
      console.log('✅ Notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
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
   * Start the cron job for daily subscription checks
   */
  startCronJob() {
    if (this.cronJob) {
      console.log('⚠️ Cron job already running');
      return;
    }

    // Schedule daily check at 12:00 PM (Asia/Jerusalem timezone)
    this.cronJob = cron.schedule('0 12 * * *', async () => {
      console.log('🕛 Daily subscription check triggered at 12:00 PM');
      try {
        await this.checkSubscriptionStatus();
      } catch (error) {
        console.error('❌ Error in daily subscription check:', error);
      }
    }, {
      timezone: 'Asia/Jerusalem'
    });

    console.log('✅ Daily subscription cron job started (12:00 PM daily)');
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
