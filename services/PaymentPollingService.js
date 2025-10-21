const LahzaPaymentService = require('./LahzaPaymentService');
const Order = require('../Models/Order');

class PaymentPollingService {
  constructor() {
    this.activePolls = new Map(); // Map of reference -> intervalId
    this.POLL_INTERVAL = 10000; // 10 seconds
    this.MAX_ATTEMPTS = 360; // 1 hour max (360 * 10 seconds)
  }

  /**
   * Start polling for a payment reference
   */
  startPolling(storeId, reference, orderId) {
    // Don't start if already polling
    if (this.activePolls.has(reference)) {
      console.log(`⚠️ Already polling for reference: ${reference}`);
      return;
    }

    console.log(`🔄 Starting polling for payment: ${reference}`);
    
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`🔍 Polling attempt ${attempts}/${this.MAX_ATTEMPTS} for ${reference}`);

      try {
        // Check payment status with Lahza
        const verificationResult = await LahzaPaymentService.verifyPayment(storeId, reference);

        if (!verificationResult.success) {
          console.log(`⚠️ Verification failed for ${reference}, will retry...`);
          
          // Stop if max attempts reached
          if (attempts >= this.MAX_ATTEMPTS) {
            console.log(`❌ Max attempts reached for ${reference}, stopping polling`);
            this.stopPolling(reference);
          }
          return;
        }

        const paymentStatus = verificationResult.data?.status;
        console.log(`💳 Payment status for ${reference}:`, paymentStatus);

        // Find order
        const order = await Order.findOne({ paymentReference: reference });
        if (!order) {
          console.log(`⚠️ Order not found for ${reference}, stopping polling`);
          this.stopPolling(reference);
          return;
        }

        // Check if payment succeeded
        if (paymentStatus === 'success' || paymentStatus === 'CAPTURED' || paymentStatus === 'paid') {
          console.log(`✅ Payment successful for ${reference}! Updating order...`);
          
          // Update order to paid
          order.paymentStatus = 'paid';
          order.status = 'processing';
          order.paidAt = new Date();
          await order.save();
          
          console.log(`✅ Order ${order.orderNumber} updated to paid`);
          
          // Update affiliate sales if this is an affiliate order
          if (order.affiliate && order.affiliateTracking?.affiliateId) {
            try {
              const Affiliation = require('../Models/Affiliation');
              const affiliateDoc = await Affiliation.findById(order.affiliateTracking.affiliateId);
              
              if (affiliateDoc) {
                const finalAmountPaid = (order.pricing?.subtotal || 0) - (order.pricing?.discount || 0);
                
                console.log(`🤝 Updating affiliate sales (polling):`, {
                  affiliateId: affiliateDoc._id,
                  finalAmountPaid,
                  commission: order.affiliateTracking.commissionEarned
                });
                
                await affiliateDoc.updateSales(finalAmountPaid, order._id);
                console.log(`✅ Affiliate sales updated successfully`);
              }
            } catch (affiliateError) {
              console.error(`⚠️ Error updating affiliate sales:`, affiliateError);
            }
          }
          
          // Stop polling
          this.stopPolling(reference);
        }
        // Check if payment failed
        else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'declined') {
          console.log(`❌ Payment failed for ${reference}! Updating order...`);
          
          // Update order as failed
          order.paymentStatus = 'unpaid';
          order.status = 'cancelled';
          await order.save();
          
          console.log(`❌ Order ${order.orderNumber} marked as failed`);
          
          // Stop polling
          this.stopPolling(reference);
        }
        // Payment still pending - continue polling
        else {
          console.log(`⏳ Payment still pending for ${reference}, will check again in 10s...`);
          
          // Stop if max attempts reached
          if (attempts >= this.MAX_ATTEMPTS) {
            console.log(`❌ Max attempts reached for ${reference}, stopping polling`);
            this.stopPolling(reference);
          }
        }

      } catch (error) {
        console.error(`❌ Error polling payment ${reference}:`, error);
        
        // Stop if max attempts reached
        if (attempts >= this.MAX_ATTEMPTS) {
          console.log(`❌ Max attempts reached for ${reference}, stopping polling`);
          this.stopPolling(reference);
        }
      }
    }, this.POLL_INTERVAL);

    // Store interval ID
    this.activePolls.set(reference, {
      intervalId: pollInterval,
      startedAt: new Date(),
      attempts: 0,
      storeId,
      orderId
    });

    console.log(`✅ Polling started for ${reference}. Active polls: ${this.activePolls.size}`);
  }

  /**
   * Stop polling for a payment reference
   */
  stopPolling(reference) {
    const poll = this.activePolls.get(reference);
    
    if (poll) {
      clearInterval(poll.intervalId);
      this.activePolls.delete(reference);
      console.log(`🛑 Stopped polling for ${reference}. Active polls: ${this.activePolls.size}`);
    }
  }

  /**
   * Get status of all active polls
   */
  getActivePolls() {
    const polls = [];
    
    this.activePolls.forEach((poll, reference) => {
      polls.push({
        reference,
        storeId: poll.storeId,
        orderId: poll.orderId,
        startedAt: poll.startedAt,
        attempts: poll.attempts,
        runningFor: Math.floor((Date.now() - poll.startedAt.getTime()) / 1000) + ' seconds'
      });
    });
    
    return polls;
  }

  /**
   * Stop all polls
   */
  stopAll() {
    console.log(`🛑 Stopping all ${this.activePolls.size} active polls...`);
    
    this.activePolls.forEach((poll, reference) => {
      clearInterval(poll.intervalId);
    });
    
    this.activePolls.clear();
    console.log('✅ All polls stopped');
  }
}

// Singleton instance
const pollingService = new PaymentPollingService();

// Cleanup on process exit
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, stopping all polls...');
  pollingService.stopAll();
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, stopping all polls...');
  pollingService.stopAll();
});

module.exports = pollingService;
