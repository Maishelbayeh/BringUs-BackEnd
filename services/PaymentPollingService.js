const PendingPayment = require('../Models/PendingPayment');
const LahzaPaymentService = require('./LahzaPaymentService');
const Store = require('../Models/Store');
const SubscriptionPlan = require('../Models/SubscriptionPlan');

/**
 * Payment Polling Service
 * Automatically checks pending payments every 10 seconds
 * Activates subscriptions when payments are successful
 * Works even if user closes browser tab!
 */
class PaymentPollingService {
  constructor() {
    this.pollingInterval = null;
    this.isRunning = false;
    this.fastPollMs = 10 * 1000; // 10 seconds - when there are pending payments
    this.slowPollMs = 60 * 1000; // 60 seconds - when no pending payments (reduce traffic)
    this.currentPollMs = this.slowPollMs; // Start with slow polling
    this.cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
    this.hasPendingPayments = false;
  }

  /**
   * Start the polling service with adaptive intervals
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Payment polling service already running');
      return;
    }

    console.log('🚀 ========================================');
    console.log('🚀 Payment Polling Service STARTED');
    console.log('🚀 Adaptive polling: 60s (idle) → 10s (when payments pending)');
    console.log('🚀 ========================================');

    this.isRunning = true;

    // Start polling cycle
    this.scheduleNextCheck();

    // Cleanup old payments every hour
    setInterval(() => {
      this.cleanupOldPayments();
    }, this.cleanupIntervalMs);
  }

  /**
   * Schedule next check with adaptive interval
   */
  scheduleNextCheck() {
    if (!this.isRunning) return;
    
    // Clear any existing timeout
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
    }

    // Use adaptive interval based on whether we have pending payments
    const interval = this.hasPendingPayments ? this.fastPollMs : this.slowPollMs;
    
    this.pollingInterval = setTimeout(async () => {
      await this.checkPendingPayments();
      this.scheduleNextCheck(); // Schedule next check
    }, interval);
  }

  /**
   * Stop the polling service
   */
  stop() {
    this.isRunning = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️ Payment polling service stopped');
    }
  }

  /**
   * Check all pending payments
   */
  async checkPendingPayments() {
    try {
      // Get all pending payments
      const pendingPayments = await PendingPayment.getPendingForPolling();

      // Update flag for adaptive polling
      const hadPendingPayments = this.hasPendingPayments;
      this.hasPendingPayments = pendingPayments.length > 0;

      // If status changed, log it
      if (!hadPendingPayments && this.hasPendingPayments) {
        console.log(`⚡ [BackgroundPolling] Pending payments detected - Switching to FAST mode (10s)`);
      } else if (hadPendingPayments && !this.hasPendingPayments) {
        console.log(`💤 [BackgroundPolling] No pending payments - Switching to SLOW mode (60s)`);
      }

      if (pendingPayments.length === 0) {
        // No pending payments - silent mode (reduce log spam)
        return;
      }

      console.log(`🔍 [BackgroundPolling] Checking ${pendingPayments.length} pending payment(s)... (${new Date().toISOString()})`);

      // Check each payment
      for (const payment of pendingPayments) {
        await this.checkSinglePayment(payment);
        // Small delay between checks to avoid rate limiting
        await this.sleep(500);
      }

    } catch (error) {
      console.error('❌ [BackgroundPolling] Error checking pending payments:', error);
    }
  }

  /**
   * Check a single pending payment
   */
  async checkSinglePayment(payment) {
    try {
      console.log(`🔄 [BackgroundPolling] Checking payment - Reference: ${payment.reference}, Store: ${payment.store}`);

      // Increment check attempts
      await payment.incrementCheckAttempts();

      // Verify payment with Lahza
      const verifyResult = await LahzaPaymentService.verifyPayment(
        payment.store.toString(),
        payment.reference
      );

      if (!verifyResult.success) {
        console.log(`⚠️ [BackgroundPolling] Could not verify payment ${payment.reference}: ${verifyResult.error}`);
        return;
      }

      const paymentStatus = verifyResult.data.status;
      console.log(`📋 [BackgroundPolling] Payment ${payment.reference} status: ${paymentStatus}`);

      // Check if payment is successful
      const isSuccessful = 
        paymentStatus === 'CAPTURED' || 
        paymentStatus === 'SUCCESS' || 
        paymentStatus === 'success';

      // Check if payment is definitively failed (NOT abandoned - user might come back)
      const isFailed = 
        paymentStatus === 'FAILED' || 
        paymentStatus === 'failed' || 
        paymentStatus === 'CANCELLED' || 
        paymentStatus === 'cancelled';

      if (isSuccessful) {
        // Payment successful! Activate subscription
        console.log(`✅ [BackgroundPolling] Payment ${payment.reference} is successful - Activating subscription...`);
        await this.activateSubscription(payment, verifyResult.data);
      } else if (isFailed) {
        // Payment definitively failed
        console.log(`❌ [BackgroundPolling] Payment ${payment.reference} failed - Status: ${paymentStatus}`);
        await payment.markAsFailed(paymentStatus);
      } else {
        // Still pending or abandoned - continue polling until success/fail or expiry
        if (paymentStatus === 'abandoned' || paymentStatus === 'ABANDONED') {
          console.log(`⏳ [BackgroundPolling] Payment ${payment.reference} abandoned - Will keep checking (user might return)`);
        } else {
          console.log(`⏳ [BackgroundPolling] Payment ${payment.reference} still pending (${paymentStatus})`);
        }
      }

    } catch (error) {
      console.error(`❌ [BackgroundPolling] Error checking payment ${payment.reference}:`, error);
      
      // Increment error count
      payment.errorCount += 1;
      payment.lastError = error.message;
      await payment.save();

      // If too many errors, mark as failed
      if (payment.errorCount >= 5) {
        console.error(`❌ [BackgroundPolling] Payment ${payment.reference} has too many errors - marking as failed`);
        await payment.markAsFailed(`Too many errors: ${error.message}`);
      }
    }
  }

  /**
   * Activate subscription for a successful payment
   */
  async activateSubscription(payment, paymentData) {
    try {
      console.log(`🔄 [BackgroundPolling] Activating subscription for payment: ${payment.reference}`);

      // Get store
      const store = await Store.findById(payment.store);
      if (!store) {
        throw new Error('Store not found');
      }

      // Check if already activated (idempotency)
      if (store.subscription?.referenceId === payment.reference && store.subscription?.isSubscribed) {
        console.log(`✅ [BackgroundPolling] Subscription already activated for payment: ${payment.reference}`);
        await payment.markAsCompleted('polling');
        return;
      }

      // Get plan
      const plan = await SubscriptionPlan.findById(payment.planId);
      if (!plan || !plan.isActive) {
        throw new Error('Plan not found or inactive');
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Update store subscription
      await Store.findByIdAndUpdate(
        payment.store,
        {
          'subscription.isSubscribed': true,
          'subscription.plan': plan.type,
          'subscription.planId': payment.planId,
          'subscription.startDate': startDate,
          'subscription.endDate': endDate,
          'subscription.lastPaymentDate': startDate,
          'subscription.nextPaymentDate': endDate,
          'subscription.autoRenew': false,
          'subscription.referenceId': payment.reference,
          'subscription.amount': plan.price,
          'subscription.currency': plan.currency,
          status: 'active'
        },
        { new: true, runValidators: true }
      );

      console.log(`✅ [BackgroundPolling] Subscription activated for store: ${payment.store}`);

      // Add subscription history
      try {
        const updatedStore = await Store.findById(payment.store);
        await updatedStore.addSubscriptionHistory(
          'subscription_activated',
          `Subscription activated via background polling - Plan: ${plan.nameEn || plan.nameAr}`,
          {
            source: 'polling',
            planId: payment.planId,
            planType: plan.type,
            amount: plan.price,
            currency: plan.currency,
            duration: plan.duration,
            reference: payment.reference,
            startDate: startDate,
            endDate: endDate,
            checkAttempts: payment.checkAttempts
          }
        );
        console.log(`📝 [BackgroundPolling] Subscription history added`);
      } catch (historyError) {
        console.error('⚠️ [BackgroundPolling] Failed to add history:', historyError.message);
      }

      // Mark payment as completed
      await payment.markAsCompleted('polling');

      console.log(`✅ ========================================`);
      console.log(`✅ Payment ${payment.reference} processed successfully!`);
      console.log(`✅ ========================================`);

    } catch (error) {
      console.error(`❌ [BackgroundPolling] Error activating subscription for payment ${payment.reference}:`, error);
      
      // Update error info
      payment.errorCount += 1;
      payment.lastError = error.message;
      await payment.save();

      // If too many errors, mark as failed
      if (payment.errorCount >= 5) {
        await payment.markAsFailed(`Activation failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Cleanup old completed/failed payments
   */
  async cleanupOldPayments() {
    try {
      const result = await PendingPayment.cleanupOldPayments();
      if (result.deletedCount > 0) {
        console.log(`🧹 [Cleanup] Deleted ${result.deletedCount} old payment record(s)`);
      }
    } catch (error) {
      console.error('❌ [Cleanup] Error cleaning up old payments:', error);
    }
  }

  /**
   * Helper to sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      mode: this.hasPendingPayments ? 'fast' : 'slow',
      currentInterval: this.hasPendingPayments ? this.fastPollMs : this.slowPollMs,
      currentIntervalSeconds: (this.hasPendingPayments ? this.fastPollMs : this.slowPollMs) / 1000,
      fastPollSeconds: this.fastPollMs / 1000,
      slowPollSeconds: this.slowPollMs / 1000,
      hasPendingPayments: this.hasPendingPayments
    };
  }
}

// Create singleton instance
const pollingService = new PaymentPollingService();

module.exports = pollingService;

