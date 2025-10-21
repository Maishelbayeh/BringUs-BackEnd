const { validationResult } = require('express-validator');
const LahzaPaymentService = require('../services/LahzaPaymentService');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Store = require('../Models/Store');

/**
 * Get user info from token
 */
const getUserFromToken = async (req) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('nameAr nameEn email phone');
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

/**
 * Get store info for payment
 */
const getStoreInfo = async (storeId) => {
  try {
    const store = await Store.findById(storeId).select('nameAr nameEn contact settings');
    
    if (!store) {
      return null;
    }

    return {
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      email: store.contact?.email,
      phone: store.contact?.phone,
      currency: store.settings?.currency || 'ILS',
      mainColor: store.settings?.mainColor || '#000000',
      language: store.settings?.language || 'en'
    };
  } catch (error) {
    console.error('Error getting store info:', error);
    return null;
  }
};

/**
 * Initialize payment with Lahza
 */
exports.initializePayment = async (req, res) => {
  try {
    // Print request body for debugging
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', req.headers);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { amount, currency, email, customerName, customerPhone, description, metadata = {} } = req.body;

    // Get store info
    const storeInfo = await getStoreInfo(storeId);
    console.log('🏪 Store info:', storeInfo);

    // Get user info from token
    const user = await getUserFromToken(req);
    console.log('👤 User from token:', user);

    // Use data in priority: body > user token > store info > defaults
    const finalEmail = email || (user ? user.email : null) || (storeInfo ? storeInfo.email : null) || 'customer@example.com';
    const finalCustomerName = customerName || (user ? (user.nameAr || user.nameEn) : null) || (storeInfo ? storeInfo.nameAr : null) || 'Customer';
    const finalCustomerPhone = customerPhone || (user ? user.phone : null) || (storeInfo ? storeInfo.phone : null) || '+1234567890';
    const finalCurrency = currency || (storeInfo ? storeInfo.currency : null) || 'ILS';

    // Prepare metadata with store and user info
    const finalMetadata = {
      storeId: storeId,
      storeName: storeInfo ? storeInfo.nameAr : 'Unknown Store',
      storeEmail: storeInfo ? storeInfo.email : null,
      ...metadata
    };

    // Add user info to metadata if available
    if (user) {
      finalMetadata.userId = user._id;
      finalMetadata.userName = user.nameAr || user.nameEn;
    }

    console.log('📝 Final payment data:', {
      amount,
      currency: finalCurrency,
      email: finalEmail,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      description,
      metadata: finalMetadata
    });

    // Use LahzaPaymentService to initialize payment
    const result = await LahzaPaymentService.initializePayment(storeId, {
      amount,
      currency: finalCurrency,
      email: finalEmail,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      description,
      metadata: finalMetadata
    });

    if (result.success) {
      // Create pending payment record for background polling
      try {
        const PendingPayment = require('../Models/PendingPayment');
        
        // Extract planId from metadata
        const planId = metadata.planId || finalMetadata.planId;
        
        if (!planId) {
          console.error('⚠️ Cannot create pending payment record: planId not provided in metadata');
        } else {
          // Set expiry to 24 hours from now
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          await PendingPayment.create({
            store: storeId,
            reference: result.data.reference,
            planId: planId,
            amount: amount,
            currency: finalCurrency,
            customerEmail: finalEmail,
            customerName: finalCustomerName,
            status: 'pending',
            metadata: finalMetadata,
            expiresAt: expiresAt
          });
          
          console.log(`✅ Pending payment record created for reference: ${result.data.reference}`);
          console.log(`📝 PlanId: ${planId}, Store: ${storeId}, Amount: ${amount} ${finalCurrency}`);
          console.log(`🔄 Background polling service will check this payment every 10 seconds for 24 hours`);
        }
      } catch (pendingPaymentError) {
        // Don't fail the request if pending payment creation fails
        console.error('⚠️ Failed to create pending payment record:', pendingPaymentError.message);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        messageAr: 'تم تهيئة الدفع بنجاح',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to initialize payment',
        messageAr: result.error || 'فشل في تهيئة الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment initialization error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      messageAr: 'خطأ في تهيئة الدفع',
      error: error.message
    });
  }
};

/**
 * Verify payment with Lahza
 * NOW ACTS AS BACKUP: If payment is successful but subscription not activated, activate it now!
 * This ensures subscription is activated even if webhook failed
 */
exports.verifyPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        messageAr: 'فشل في التحقق من صحة البيانات',
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { reference, planId } = req.body;

    console.log('🔍 ========================================');
    console.log('🔍 Verify payment request');
    console.log('🔍 ========================================');
    console.log(`Store ID: ${storeId}`);
    console.log(`Reference: ${reference}`);
    console.log(`Plan ID: ${planId}`);

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
        messageAr: 'مرجع الدفع مطلوب'
      });
    }

    // Use LahzaPaymentService to verify payment
    const result = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (!result.success) {
      console.error('❌ Payment verification failed:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error || 'Payment verification failed',
        messageAr: result.error || 'فشل في التحقق من الدفع',
        error: result.error,
        details: result.details
      });
    }

    console.log(`✅ Payment verified successfully`);
    console.log(`Payment status: ${result.data.status}`);

    // Check if payment is successful
    const paymentStatus = result.data.status;
    const isPaymentSuccessful = paymentStatus === 'CAPTURED' || paymentStatus === 'SUCCESS' || paymentStatus === 'success';

    if (!isPaymentSuccessful) {
      console.log(`ℹ️ Payment not successful (status: ${paymentStatus}), no activation needed`);
      return res.status(200).json({
        success: true,
        message: 'Payment verified but not successful',
        messageAr: 'تم التحقق من الدفع لكنه غير ناجح',
        data: result.data,
        paymentSuccessful: false,
        subscriptionActivated: false
      });
    }

    // Payment is successful - check if subscription is already activated
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);

    if (!store) {
      console.error('❌ Store not found');
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Check if subscription is already activated with this reference
    const isAlreadyActivated = store.subscription?.referenceId === reference && store.subscription?.isSubscribed;

    if (isAlreadyActivated) {
      console.log('✅ Subscription already activated');
      return res.status(200).json({
        success: true,
        message: 'Payment successful and subscription already activated',
        messageAr: 'الدفع ناجح والاشتراك مفعل بالفعل',
        data: result.data,
        paymentSuccessful: true,
        subscriptionActivated: true,
        alreadyActivated: true,
        subscription: store.subscription
      });
    }

    // Payment successful but subscription NOT activated yet
    // This is the BACKUP scenario - webhook may have failed
    console.log('⚠️ Payment successful but subscription NOT activated - activating now as BACKUP');

    // Extract planId from metadata or request body
    let extractedPlanId = planId;
    if (!extractedPlanId && result.data.metadata) {
      try {
        const metadata = typeof result.data.metadata === 'string' ? JSON.parse(result.data.metadata) : result.data.metadata;
        extractedPlanId = metadata.planId;
      } catch (parseError) {
        console.error('⚠️ Failed to parse metadata:', parseError.message);
      }
    }

    if (!extractedPlanId) {
      console.error('❌ Plan ID not found - cannot activate subscription');
      return res.status(200).json({
        success: true,
        message: 'Payment successful but cannot activate subscription - Plan ID missing',
        messageAr: 'الدفع ناجح لكن لا يمكن تفعيل الاشتراك - معرف الخطة مفقود',
        data: result.data,
        paymentSuccessful: true,
        subscriptionActivated: false,
        error: 'Plan ID not found in payment metadata or request',
        note: 'Please contact support with this reference number',
        noteAr: 'يرجى التواصل مع الدعم بهذا الرقم المرجعي',
        reference: reference
      });
    }

    // Activate subscription using the safe helper function
    console.log('🔄 Attempting to activate subscription via verify endpoint (BACKUP)');
    const activationResult = await activateSubscriptionSafely(storeId, extractedPlanId, reference, 'verify-backup');

    if (activationResult.success) {
      console.log('✅ ========================================');
      console.log('✅ Subscription activated successfully via BACKUP');
      console.log('✅ ========================================');

      return res.status(200).json({
        success: true,
        message: 'Payment successful and subscription activated',
        messageAr: 'الدفع ناجح وتم تفعيل الاشتراك',
        data: result.data,
        paymentSuccessful: true,
        subscriptionActivated: true,
        alreadyActivated: activationResult.alreadyActivated,
        subscription: activationResult.subscription,
        plan: activationResult.plan,
        note: 'Subscription was activated via backup verification (webhook may have failed)',
        noteAr: 'تم تفعيل الاشتراك عبر التحقق الاحتياطي (ربما فشل الwebhook)'
      });
    } else {
      console.error('❌ ========================================');
      console.error('❌ Subscription activation FAILED via BACKUP');
      console.error('❌ ========================================');
      console.error('Error:', activationResult.message);

      return res.status(200).json({
        success: false,
        message: 'Payment successful but subscription activation failed',
        messageAr: 'الدفع ناجح لكن فشل تفعيل الاشتراك',
        data: result.data,
        paymentSuccessful: true,
        subscriptionActivated: false,
        error: activationResult.message,
        errorAr: activationResult.messageAr,
        reference: reference,
        note: 'Please contact support with this reference number',
        noteAr: 'يرجى التواصل مع الدعم بهذا الرقم المرجعي'
      });
    }

  } catch (error) {
    console.error('❌ Lahza payment verification error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      messageAr: 'خطأ في التحقق من الدفع',
      error: error.message
    });
  }
};

/**
 * Get payment status
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { storeId, reference } = req.params;

    // Use LahzaPaymentService to get payment status
    const result = await LahzaPaymentService.getPaymentStatus(storeId, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to get payment status',
        messageAr: result.error || 'فشل في الحصول على حالة الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Get payment status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      messageAr: 'خطأ في الحصول على حالة الدفع',
      error: error.message
    });
  }
};

/**
 * Poll payment status - For frontend to check payment status every 10 seconds
 * This endpoint checks payment status AND activates subscription if payment successful
 * Perfect for when user closes tab before returning
 */
exports.pollPaymentStatus = async (req, res) => {
  try {
    const { storeId, reference } = req.params;
    const { planId } = req.query;

    console.log(`🔄 [Poll] Checking payment status - Reference: ${reference}`);

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
        messageAr: 'مرجع الدفع مطلوب',
        status: 'error'
      });
    }

    // Get payment status from Lahza
    const result = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (!result.success) {
      console.log(`⚠️ [Poll] Failed to verify payment: ${result.error}`);
      return res.status(200).json({
        success: false,
        message: 'Unable to verify payment status',
        messageAr: 'لا يمكن التحقق من حالة الدفع',
        status: 'pending',
        shouldContinuePolling: true,
        error: result.error
      });
    }

    const paymentStatus = result.data.status;
    console.log(`📋 [Poll] Payment status: ${paymentStatus}`);

    // Check if payment is successful
    const isPaymentSuccessful = 
      paymentStatus === 'CAPTURED' || 
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'success';

    // Check if payment is definitively failed (NOT abandoned - user might come back)
    const isPaymentFailed = 
      paymentStatus === 'FAILED' || 
      paymentStatus === 'failed' || 
      paymentStatus === 'CANCELLED' || 
      paymentStatus === 'cancelled';

    // If payment definitively failed, stop polling
    if (isPaymentFailed) {
      console.log(`❌ [Poll] Payment failed - Status: ${paymentStatus}`);
      
      // Mark pending payment as failed
      try {
        const PendingPayment = require('../Models/PendingPayment');
        const pendingPayment = await PendingPayment.findOne({ reference: reference });
        if (pendingPayment) {
          await pendingPayment.markAsFailed(paymentStatus);
          console.log(`📝 [Poll] Pending payment marked as failed`);
        }
      } catch (pendingError) {
        console.error('⚠️ [Poll] Failed to update pending payment:', pendingError.message);
      }
      
      return res.status(200).json({
        success: false,
        message: 'Payment failed',
        messageAr: 'فشلت عملية الدفع',
        status: 'failed',
        shouldContinuePolling: false,
        paymentStatus: paymentStatus,
        data: result.data
      });
    }

    // If payment not yet successful (including abandoned), continue polling
    if (!isPaymentSuccessful) {
      const isAbandoned = paymentStatus === 'abandoned' || paymentStatus === 'ABANDONED';
      
      if (isAbandoned) {
        console.log(`⏳ [Poll] Payment abandoned - Will keep checking (user might return) - Status: ${paymentStatus}`);
      } else {
        console.log(`⏳ [Poll] Payment still pending - Status: ${paymentStatus}`);
      }
      
      return res.status(200).json({
        success: true,
        message: isAbandoned 
          ? 'Payment not completed yet - checking if user returns...'
          : 'Payment is still being processed',
        messageAr: isAbandoned
          ? 'لم يكتمل الدفع بعد - يتم التحقق إذا عاد المستخدم...'
          : 'جاري معالجة الدفع',
        status: 'pending',
        shouldContinuePolling: true,
        paymentStatus: paymentStatus,
        note: isAbandoned ? 'User can still complete the payment' : undefined
      });
    }

    // Payment is successful! Now check subscription status
    console.log(`✅ [Poll] Payment successful - Checking subscription status`);

    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);

    if (!store) {
      console.error(`❌ [Poll] Store not found: ${storeId}`);
      return res.status(200).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود',
        status: 'error',
        shouldContinuePolling: false
      });
    }

    // Check if subscription is already activated
    const isAlreadyActivated = 
      store.subscription?.referenceId === reference && 
      store.subscription?.isSubscribed;

    if (isAlreadyActivated) {
      console.log(`✅ [Poll] Subscription already activated!`);
      return res.status(200).json({
        success: true,
        message: 'Payment successful and subscription activated',
        messageAr: 'الدفع ناجح والاشتراك مفعل',
        status: 'success',
        shouldContinuePolling: false,
        paymentStatus: paymentStatus,
        subscriptionActivated: true,
        alreadyActivated: true,
        subscription: store.subscription
      });
    }

    // Payment successful but subscription NOT activated yet
    // Activate it now!
    console.log(`🔄 [Poll] Payment successful but subscription not activated - Activating now!`);

    // Extract planId from metadata or query param
    let extractedPlanId = planId;
    if (!extractedPlanId && result.data.metadata) {
      try {
        const metadata = typeof result.data.metadata === 'string' ? 
          JSON.parse(result.data.metadata) : 
          result.data.metadata;
        extractedPlanId = metadata.planId;
      } catch (parseError) {
        console.error('⚠️ [Poll] Failed to parse metadata:', parseError.message);
      }
    }

    if (!extractedPlanId) {
      console.error(`❌ [Poll] Plan ID not found - Cannot activate subscription`);
      return res.status(200).json({
        success: false,
        message: 'Payment successful but cannot activate subscription - Plan ID missing',
        messageAr: 'الدفع ناجح لكن لا يمكن تفعيل الاشتراك - معرف الخطة مفقود',
        status: 'error',
        shouldContinuePolling: false,
        paymentStatus: paymentStatus,
        subscriptionActivated: false,
        error: 'Plan ID not found',
        note: 'Please contact support with reference number',
        noteAr: 'يرجى التواصل مع الدعم مع الرقم المرجعي',
        reference: reference
      });
    }

    // Activate subscription using our safe helper function
    const activationResult = await activateSubscriptionSafely(
      storeId, 
      extractedPlanId, 
      reference, 
      'polling'
    );

    if (activationResult.success) {
      console.log(`✅ [Poll] Subscription activated successfully via polling!`);
      
      // Mark pending payment as completed
      try {
        const PendingPayment = require('../Models/PendingPayment');
        const pendingPayment = await PendingPayment.findOne({ reference: reference });
        if (pendingPayment) {
          await pendingPayment.markAsCompleted('polling-frontend');
          console.log(`📝 [Poll] Pending payment marked as completed`);
        }
      } catch (pendingError) {
        console.error('⚠️ [Poll] Failed to update pending payment:', pendingError.message);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment successful and subscription activated',
        messageAr: 'الدفع ناجح وتم تفعيل الاشتراك',
        status: 'success',
        shouldContinuePolling: false,
        paymentStatus: paymentStatus,
        subscriptionActivated: true,
        alreadyActivated: activationResult.alreadyActivated,
        subscription: activationResult.subscription,
        plan: activationResult.plan,
        note: 'Subscription activated via polling (user may have closed tab)',
        noteAr: 'تم تفعيل الاشتراك عبر المراقبة التلقائية (ربما أغلق المستخدم المتصفح)'
      });
    } else {
      console.error(`❌ [Poll] Failed to activate subscription: ${activationResult.message}`);
      return res.status(200).json({
        success: false,
        message: 'Payment successful but subscription activation failed',
        messageAr: 'الدفع ناجح لكن فشل تفعيل الاشتراك',
        status: 'error',
        shouldContinuePolling: false,
        paymentStatus: paymentStatus,
        subscriptionActivated: false,
        error: activationResult.message,
        errorAr: activationResult.messageAr,
        reference: reference
      });
    }

  } catch (error) {
    console.error('❌ [Poll] Error checking payment status:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(200).json({
      success: false,
      message: 'Error checking payment status',
      messageAr: 'خطأ في التحقق من حالة الدفع',
      status: 'error',
      shouldContinuePolling: true, // Continue polling even on error
      error: error.message
    });
  }
};

/**
 * Manual activation endpoint - Force check and activate subscription if payment was successful
 * Use this if automatic systems failed
 */
exports.manualActivate = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { reference, planId } = req.body;

    console.log(`🔧 [Manual] Manual activation request - Reference: ${reference}`);

    if (!reference || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Reference and planId are required',
        messageAr: 'المرجع ومعرف الخطة مطلوبان'
      });
    }

    // Verify payment with Lahza
    const verifyResult = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify payment with Lahza',
        messageAr: 'لا يمكن التحقق من الدفع',
        error: verifyResult.error
      });
    }

    const paymentStatus = verifyResult.data.status;
    console.log(`📋 [Manual] Payment status: ${paymentStatus}`);

    // Check if payment is successful
    const isSuccessful = 
      paymentStatus === 'CAPTURED' || 
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'success';

    if (!isSuccessful) {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${paymentStatus} - Cannot activate subscription`,
        messageAr: `حالة الدفع ${paymentStatus} - لا يمكن تفعيل الاشتراك`,
        paymentStatus: paymentStatus,
        paymentData: verifyResult.data
      });
    }

    // Payment is successful! Activate subscription
    console.log(`✅ [Manual] Payment successful - Activating subscription...`);
    
    const activationResult = await activateSubscriptionSafely(storeId, planId, reference, 'manual');

    if (activationResult.success) {
      // Create/update pending payment record
      try {
        const PendingPayment = require('../Models/PendingPayment');
        let pendingPayment = await PendingPayment.findOne({ reference: reference });
        
        if (pendingPayment) {
          await pendingPayment.markAsCompleted('manual');
        } else {
          // Create it now for tracking
          await PendingPayment.create({
            store: storeId,
            reference: reference,
            planId: planId,
            amount: verifyResult.data.amount ? parseInt(verifyResult.data.amount) / 100 : 0,
            currency: verifyResult.data.currency || 'USD',
            status: 'completed',
            subscriptionActivated: true,
            activatedAt: new Date(),
            activationSource: 'manual',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });
        }
      } catch (pendingError) {
        console.error('⚠️ Failed to update pending payment:', pendingError.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Subscription activated successfully',
        messageAr: 'تم تفعيل الاشتراك بنجاح',
        paymentStatus: paymentStatus,
        subscriptionActivated: true,
        alreadyActivated: activationResult.alreadyActivated,
        subscription: activationResult.subscription,
        plan: activationResult.plan
      });
    } else {
      return res.status(500).json({
        success: false,
        message: activationResult.message,
        messageAr: activationResult.messageAr,
        error: activationResult.error
      });
    }

  } catch (error) {
    console.error('❌ [Manual] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error activating subscription',
      messageAr: 'خطأ في تفعيل الاشتراك',
      error: error.message
    });
  }
};

/**
 * Check polling service status and pending payments
 */
exports.getPollingStatus = async (req, res) => {
  try {
    const PendingPayment = require('../Models/PendingPayment');
    const PaymentPollingService = require('../services/PaymentPollingService');
    
    // Get service status
    const serviceStatus = PaymentPollingService.getStatus();
    
    // Get pending payments
    const pendingPayments = await PendingPayment.find({ status: 'pending' }).sort({ createdAt: -1 });
    
    // Get recently completed
    const completed = await PendingPayment.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(5);
    
    // Get failed/abandoned
    const failed = await PendingPayment.find({ status: { $in: ['failed', 'abandoned'] } }).sort({ completedAt: -1 }).limit(5);
    
    return res.status(200).json({
      success: true,
      message: 'Polling service status retrieved',
      messageAr: 'تم جلب حالة خدمة المراقبة',
      service: serviceStatus,
      pendingCount: pendingPayments.length,
      pending: pendingPayments.map(p => ({
        reference: p.reference,
        store: p.store,
        planId: p.planId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        checkAttempts: p.checkAttempts,
        lastCheckedAt: p.lastCheckedAt,
        createdAt: p.createdAt,
        errorCount: p.errorCount,
        lastError: p.lastError
      })),
      completedCount: completed.length,
      completed: completed.map(p => ({
        reference: p.reference,
        activationSource: p.activationSource,
        activatedAt: p.activatedAt,
        checkAttempts: p.checkAttempts
      })),
      failedCount: failed.length,
      failed: failed.map(p => ({
        reference: p.reference,
        status: p.status,
        lastError: p.lastError
      }))
    });
  } catch (error) {
    console.error('Error getting polling status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting polling status',
      messageAr: 'خطأ في جلب حالة المراقبة',
      error: error.message
    });
  }
};

/**
 * Test Lahza connection
 */
exports.testConnection = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Use LahzaPaymentService to test connection
    const result = await LahzaPaymentService.testConnection(storeId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Lahza connection test successful',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Lahza connection test failed',
        messageAr: result.error || 'فشل في اختبار الاتصال بـ Lahza',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Lahza connection test error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lahza connection test failed',
      messageAr: 'فشل في اختبار الاتصال بـ Lahza',
      error: error.message
    });
  }
};

/**
 * Helper function to safely activate subscription with full error handling
 * This ensures activation works even if there are errors
 */
async function activateSubscriptionSafely(storeId, planId, reference, source = 'webhook') {
  const SubscriptionPlan = require('../Models/SubscriptionPlan');
  const Store = require('../Models/Store');
  
  try {
    console.log(`🔄 [${source}] Attempting to activate subscription for store: ${storeId}`);
    
    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      console.error(`❌ [${source}] Store not found: ${storeId}`);
      return {
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود',
        alreadyActivated: false
      };
    }

    // Check if subscription is already activated with this reference (idempotency)
    if (store.subscription?.referenceId === reference && store.subscription?.isSubscribed) {
      console.log(`✅ [${source}] Subscription already activated with reference: ${reference}`);
      return {
        success: true,
        message: 'Subscription already activated',
        messageAr: 'الاشتراك مفعل بالفعل',
        alreadyActivated: true,
        subscription: store.subscription
      };
    }

    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      console.error(`❌ [${source}] Plan not found or inactive: ${planId}`);
      return {
        success: false,
        message: 'Subscription plan not found or inactive',
        messageAr: 'خطة الاشتراك غير موجودة أو غير نشطة',
        alreadyActivated: false
      };
    }

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.duration);

    // Update store subscription - wrapped in try-catch for safety
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        'subscription.isSubscribed': true,
        'subscription.plan': plan.type,
        'subscription.planId': planId,
        'subscription.startDate': subscriptionStartDate,
        'subscription.endDate': subscriptionEndDate,
        'subscription.lastPaymentDate': subscriptionStartDate,
        'subscription.nextPaymentDate': subscriptionEndDate,
        'subscription.autoRenew': false,
        'subscription.referenceId': reference,
        'subscription.amount': plan.price,
        'subscription.currency': plan.currency,
        status: 'active'
      },
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      throw new Error('Failed to update store subscription');
    }

    console.log(`✅ [${source}] Subscription activated successfully for store: ${storeId}`);

    // Add subscription history entry
    try {
      await updatedStore.addSubscriptionHistory(
        'subscription_activated',
        `Subscription activated via ${source} - Plan: ${plan.nameEn || plan.nameAr}`,
        {
          source: source,
          planId: planId,
          planType: plan.type,
          amount: plan.price,
          currency: plan.currency,
          duration: plan.duration,
          reference: reference,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate
        }
      );
      console.log(`📝 [${source}] Subscription history added for store: ${storeId}`);
    } catch (historyError) {
      // Don't fail activation if history fails
      console.error(`⚠️ [${source}] Failed to add subscription history:`, historyError.message);
    }

    return {
      success: true,
      message: 'Subscription activated successfully',
      messageAr: 'تم تفعيل الاشتراك بنجاح',
      alreadyActivated: false,
      subscription: updatedStore.subscription,
      plan: {
        name: plan.nameEn,
        nameAr: plan.nameAr,
        type: plan.type,
        duration: plan.duration,
        price: plan.price,
        currency: plan.currency
      }
    };

  } catch (error) {
    console.error(`❌ [${source}] Error activating subscription:`, error);
    return {
      success: false,
      message: `Failed to activate subscription: ${error.message}`,
      messageAr: `فشل في تفعيل الاشتراك: ${error.message}`,
      error: error.message,
      alreadyActivated: false
    };
  }
}

/**
 * Handle Lahza webhook - Payment gateway will call this
 * This ensures subscription is activated even if user doesn't return to site
 * NOW WITH FULL ERROR HANDLING AND RECOVERY
 */
exports.handleWebhook = async (req, res) => {
  let storeId;
  let reference;
  
  try {
    console.log('📨 ========================================');
    console.log('📨 Webhook received from Lahza');
    console.log('📨 ========================================');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    storeId = req.params.storeId;
    const webhookData = req.body;

    if (!storeId) {
      console.error('❌ Webhook error: storeId is missing');
      return res.status(400).json({
        success: false,
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }

    // Handle the webhook
    const result = await LahzaPaymentService.handleWebhook(webhookData, storeId);

    if (!result.success) {
      console.error('❌ Webhook processing failed:', result.error);
      return res.status(400).json({
        success: false,
        message: 'Webhook processing failed',
        messageAr: 'فشل في معالجة إشعار الدفع',
        error: result.error
      });
    }

    reference = result.reference;
    console.log(`📋 Payment reference: ${reference}`);
    console.log(`📋 Payment status: ${result.paymentStatus}`);

    // If payment was successful, activate the subscription
    if (result.paymentStatus === 'CAPTURED' || result.paymentStatus === 'SUCCESS' || result.paymentStatus === 'success') {
      console.log('✅ Payment successful, processing subscription activation');
      
      // Extract metadata from payment data
      let metadata = {};
      try {
        metadata = result.data.metadata ? (typeof result.data.metadata === 'string' ? JSON.parse(result.data.metadata) : result.data.metadata) : {};
      } catch (parseError) {
        console.error('⚠️ Failed to parse metadata:', parseError.message);
      }
      
      const planId = metadata.planId;
      
      if (!planId) {
        console.error('❌ Plan ID not found in payment metadata');
        return res.status(200).json({
          success: false,
          message: 'Plan ID not found in payment metadata',
          messageAr: 'معرف الخطة غير موجود في بيانات الدفع',
          event: result.event,
          status: result.paymentStatus,
          reference: reference
        });
      }

      // Activate subscription using the safe helper function
      const activationResult = await activateSubscriptionSafely(storeId, planId, reference, 'webhook');
      
      // Mark pending payment as completed (whether activation succeeded or not)
      try {
        const PendingPayment = require('../Models/PendingPayment');
        const pendingPayment = await PendingPayment.findOne({ reference: reference });
        if (pendingPayment && activationResult.success) {
          await pendingPayment.markAsCompleted('webhook');
          console.log(`📝 [Webhook] Pending payment marked as completed`);
        } else if (pendingPayment && !activationResult.success) {
          // Update error but keep as pending so polling can retry
          pendingPayment.lastError = activationResult.message;
          pendingPayment.errorCount += 1;
          await pendingPayment.save();
          console.log(`⚠️ [Webhook] Pending payment updated with error`);
        }
      } catch (pendingError) {
        console.error('⚠️ [Webhook] Failed to update pending payment:', pendingError.message);
      }
      
      if (activationResult.success) {
        console.log('✅ ========================================');
        console.log('✅ Subscription activation SUCCESS');
        console.log('✅ ========================================');
        
        return res.status(200).json({
          success: true,
          message: activationResult.message,
          messageAr: activationResult.messageAr,
          event: result.event,
          status: result.paymentStatus,
          reference: reference,
          alreadyActivated: activationResult.alreadyActivated,
          subscription: activationResult.subscription
        });
      } else {
        console.error('❌ ========================================');
        console.error('❌ Subscription activation FAILED');
        console.error('❌ ========================================');
        console.error('Error:', activationResult.message);
        
        // Still return 200 to acknowledge webhook receipt
        // But indicate activation failed so verify endpoint can retry
        return res.status(200).json({
          success: false,
          message: activationResult.message,
          messageAr: activationResult.messageAr,
          event: result.event,
          status: result.paymentStatus,
          reference: reference,
          error: activationResult.error,
          note: 'Payment successful but subscription activation failed. Will be retried on user return.',
          noteAr: 'الدفع ناجح لكن فشل تفعيل الاشتراك. سيتم المحاولة مرة أخرى عند عودة المستخدم.'
        });
      }
    } else {
      // Payment not successful
      console.log(`ℹ️ Payment status is ${result.paymentStatus}, no activation needed`);
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        messageAr: 'تمت معالجة إشعار الدفع بنجاح',
        event: result.event,
        status: result.paymentStatus,
        reference: reference,
        note: 'Payment not successful, no action taken'
      });
    }

  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ CRITICAL Webhook error:', error);
    console.error('❌ ========================================');
    console.error('Error stack:', error.stack);
    
    // Still return 200 to prevent payment gateway retries
    // But log the error for manual intervention
    return res.status(200).json({
      success: false,
      message: 'Webhook received but critical error occurred',
      messageAr: 'تم استلام إشعار الدفع لكن حدث خطأ خطير',
      error: error.message,
      storeId: storeId,
      reference: reference,
      note: 'Critical error - manual intervention may be required. Payment data logged.',
      noteAr: 'خطأ خطير - قد يتطلب تدخل يدوي. تم تسجيل بيانات الدفع.'
    });
  }
};