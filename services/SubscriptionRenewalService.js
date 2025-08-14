const Store = require('../Models/Store');
const axios = require('axios');

class SubscriptionRenewalService {
  constructor() {
    this.lahzaApiKey = 'sk_test_aJgxg75kYKtW6qVuTgijJyzpuhszRSvc4';
    this.lahzaApiUrl = 'https://api.lahza.io/transaction/charge_authorization';
  }

  /**
   * تحويل العملة إلى الوحدة المطلوبة (aghora, qirsh, cents)
   */
  convertToSmallestUnit(amount, currency) {
    switch (currency.toUpperCase()) {
      case 'ILS':
        return Math.round(amount * 100); // aghora
      case 'JOD':
        return Math.round(amount * 1000); // qirsh
      case 'USD':
        return Math.round(amount * 100); // cents
      case 'EUR':
        return Math.round(amount * 100); // cents
      case 'SAR':
        return Math.round(amount * 100); // halala
      case 'AED':
        return Math.round(amount * 100); // fils
      case 'EGP':
        return Math.round(amount * 100); // piastres
      default:
        return Math.round(amount * 100); // default to cents
    }
  }

  /**
   * استدعاء API Lahza لخصم المبلغ
   */
  async chargeAuthorization(amount, email, authorizationCode, currency = 'ILS') {
    try {
      const convertedAmount = this.convertToSmallestUnit(amount, currency);

      const response = await axios.post(this.lahzaApiUrl, {
        amount: convertedAmount.toString(),
        email: email,
        authorization_code: authorizationCode
      }, {
        headers: {
          'authorization': `Bearer ${this.lahzaApiKey}`,
          'content-type': 'application/json'
        }
      });

      console.log('✅ Lahza API response:', response.data);
      
      // التحقق من نجاح العملية
      if (response.data.status === true && response.data.data?.status === 'success') {
        return {
          success: true,
          data: response.data,
          transactionId: response.data.data?.id || null,
          reference: response.data.data?.reference || null,
          authorizationCode: response.data.data?.authorization?.authorization_code || null,
          amount: response.data.data?.amount || null,
          currency: response.data.data?.currency || null,
          gatewayResponse: response.data.data?.gateway_response || null
        };
      } else {
        // العملية فشلت
        return {
          success: false,
          error: response.data.message || 'Transaction failed',
          data: response.data
        };
      }
    } catch (error) {
      console.error('❌ Lahza API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * تجديد اشتراك تلقائي
   */
  async renewSubscription(store) {
    try {
      console.log(`🔄 Attempting to renew subscription for store: ${store.nameEn} (${store._id})`);

      // التحقق من وجود البيانات المطلوبة
      if (!store.subscription.referenceId) {
        console.log(`❌ No referenceId found for store: ${store._id}`);
        return { success: false, error: 'No authorization code found' };
      }

      if (!store.contact?.email) {
        console.log(`❌ No email found for store: ${store._id}`);
        return { success: false, error: 'No email found' };
      }

      if (!store.subscription.amount || store.subscription.amount <= 0) {
        console.log(`❌ Invalid amount for store: ${store._id}`);
        return { success: false, error: 'Invalid amount' };
      }

             // استدعاء API Lahza
       const chargeResult = await this.chargeAuthorization(
         store.subscription.amount,
         store.contact.email,
         store.subscription.referenceId,
         store.subscription.currency || 'ILS'
       );

      if (!chargeResult.success) {
        // إضافة إلى سجل الاشتراك
        await this.addSubscriptionHistory(store._id, 'payment_failed', {
          error: chargeResult.error,
          amount: store.subscription.amount,
          email: store.contact.email
        });

        return chargeResult;
      }

      // تحديث تاريخ الدفع التالي
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      // تحديث بيانات الاشتراك
      const updateData = {
        'subscription.lastPaymentDate': new Date(),
        'subscription.nextPaymentDate': nextPaymentDate,
        'subscription.isSubscribed': true
      };

      await Store.findByIdAndUpdate(store._id, updateData);

             // إضافة إلى سجل الاشتراك
       await this.addSubscriptionHistory(store._id, 'payment_received', {
         amount: chargeResult.amount || store.subscription.amount,
         currency: chargeResult.currency || store.subscription.currency,
         transactionId: chargeResult.transactionId,
         reference: chargeResult.reference,
         authorizationCode: chargeResult.authorizationCode,
         gatewayResponse: chargeResult.gatewayResponse,
         nextPaymentDate: nextPaymentDate
       });

       console.log(`✅ Successfully renewed subscription for store: ${store._id}`);
       console.log(`💰 Transaction details: ID=${chargeResult.transactionId}, Reference=${chargeResult.reference}, Amount=${chargeResult.amount} ${chargeResult.currency}`);
       return { 
         success: true, 
         transactionId: chargeResult.transactionId,
         reference: chargeResult.reference,
         amount: chargeResult.amount,
         currency: chargeResult.currency
       };

    } catch (error) {
      console.error(`❌ Error renewing subscription for store ${store._id}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * إضافة سجل إلى تاريخ الاشتراك
   */
  async addSubscriptionHistory(storeId, action, details = {}) {
    try {
      await Store.findByIdAndUpdate(storeId, {
        $push: {
          subscriptionHistory: {
            action,
            description: this.getActionDescription(action),
            details,
            performedAt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('❌ Error adding subscription history:', error);
    }
  }

  /**
   * الحصول على وصف الإجراء
   */
  getActionDescription(action) {
    const descriptions = {
      'payment_received': 'تم استلام الدفع بنجاح',
      'payment_failed': 'فشل في استلام الدفع',
      'subscription_renewed': 'تم تجديد الاشتراك',
      'subscription_expired': 'انتهت صلاحية الاشتراك',
      'auto_renewal_attempted': 'محاولة تجديد تلقائي'
    };
    return descriptions[action] || action;
  }

  /**
   * فحص الاشتراكات المنتهية وتحويلها إلى inactive
   */
  async checkExpiredSubscriptions() {
    try {
      console.log('🔍 Checking for expired subscriptions...');

      const expiredStores = await Store.find({
        'subscription.isSubscribed': true,
        'subscription.endDate': { $lt: new Date() }
      });

      console.log(`📊 Found ${expiredStores.length} expired subscriptions`);

      for (const store of expiredStores) {
        console.log(`🔄 Processing expired store: ${store.nameEn} (${store._id})`);

        // تحويل المتجر إلى inactive
        await Store.findByIdAndUpdate(store._id, {
          'subscription.isSubscribed': false,
          status: 'inactive'
        });

        // إضافة إلى سجل الاشتراك
        await this.addSubscriptionHistory(store._id, 'subscription_expired', {
          expiredDate: store.subscription.endDate,
          previousStatus: 'active'
        });

        console.log(`✅ Store ${store._id} marked as inactive due to expired subscription`);
      }

      return { success: true, expiredCount: expiredStores.length };
    } catch (error) {
      console.error('❌ Error checking expired subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * فحص الاشتراكات التي تحتاج تجديد تلقائي
   */
  async checkAutoRenewals() {
    try {
      console.log('🔄 Checking for auto-renewals...');

      const storesNeedingRenewal = await Store.find({
        'subscription.autoRenew': true,
        'subscription.trialEndDate': { $lte: new Date() },
        'subscription.isSubscribed': false,
        'subscription.referenceId': { $exists: true, $ne: null },
        'contact.email': { $exists: true, $ne: null }
      });

      console.log(`📊 Found ${storesNeedingRenewal.length} stores needing auto-renewal`);

      let successCount = 0;
      let failureCount = 0;

      for (const store of storesNeedingRenewal) {
        console.log(`🔄 Processing auto-renewal for store: ${store.nameEn} (${store._id})`);

        const renewalResult = await this.renewSubscription(store);

        if (renewalResult.success) {
          successCount++;
        } else {
          failureCount++;
          console.log(`❌ Auto-renewal failed for store ${store._id}:`, renewalResult.error);
        }
      }

      console.log(`✅ Auto-renewal completed. Success: ${successCount}, Failures: ${failureCount}`);
      return { 
        success: true, 
        totalProcessed: storesNeedingRenewal.length,
        successCount,
        failureCount
      };

    } catch (error) {
      console.error('❌ Error checking auto-renewals:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * تشغيل فحص شامل للاشتراكات
   */
  async runSubscriptionCheck() {
    try {
      console.log('🚀 Starting comprehensive subscription check...');

      // فحص الاشتراكات المنتهية
      const expiredResult = await this.checkExpiredSubscriptions();
      
      // فحص التجديد التلقائي
      const renewalResult = await this.checkAutoRenewals();

      console.log('✅ Comprehensive subscription check completed');
      console.log('📊 Summary:', {
        expiredSubscriptions: expiredResult.expiredCount || 0,
        autoRenewalsProcessed: renewalResult.totalProcessed || 0,
        autoRenewalsSuccess: renewalResult.successCount || 0,
        autoRenewalsFailed: renewalResult.failureCount || 0
      });

      return {
        success: true,
        expired: expiredResult,
        renewals: renewalResult
      };

    } catch (error) {
      console.error('❌ Error in comprehensive subscription check:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * بدء Cron Job للفحص الشهري
   */
  startMonthlyCronJob() {
    // تشغيل كل شهر في اليوم الأول من الشهر الساعة 2 صباحاً
    const cronExpression = '0 2 1 * *'; // كل شهر في اليوم الأول الساعة 2 صباحاً
    
    console.log('⏰ Starting monthly subscription cron job...');
    
    // يمكن استخدام node-cron هنا
    // cron.schedule(cronExpression, () => {
    //   this.runSubscriptionCheck();
    // });

    // للتجربة، سنقوم بتشغيل الفحص كل ساعة
    setInterval(() => {
      console.log('⏰ Running scheduled subscription check...');
      this.runSubscriptionCheck();
    }, 60 * 60 * 1000); // كل ساعة

    console.log('✅ Monthly subscription cron job started');
  }
}

module.exports = new SubscriptionRenewalService();
