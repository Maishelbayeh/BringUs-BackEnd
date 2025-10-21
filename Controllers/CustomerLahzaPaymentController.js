const { validationResult } = require('express-validator');
const LahzaPaymentService = require('../services/LahzaPaymentService');
const PaymentPollingService = require('../services/PaymentPollingService');
const Store = require('../Models/Store');
const Order = require('../Models/Order');
const Product = require('../Models/Product');

/**
 * Initialize Lahza payment for customer checkout
 * This is for end-users (customers), not admin POS
 */
exports.initializeCustomerPayment = async (req, res) => {
  try {
    console.log('📋 Customer payment initialization request:', JSON.stringify(req.body, null, 2));

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
    const { 
      amount, 
      currency, 
      email, 
      first_name,
      last_name,
      phone,
      callback_url,
      metadata = {},
      // Order data for creating order immediately
      orderData: customerOrderData
    } = req.body;

    // Get store info
    const store = await Store.findById(storeId).select('nameAr nameEn slug settings lahzaSecretKey');
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    console.log('🏪 Store info:', {
      id: store._id,
      name: store.nameEn,
      slug: store.slug,
      hasLahzaKey: !!store.lahzaSecretKey
    });

    // Prepare customer name
    const customerName = `${first_name} ${last_name}`.trim();

    // Prepare final metadata
    const finalMetadata = {
      storeId: storeId,
      storeName: store.nameAr || store.nameEn,
      order_type: 'customer_checkout',
      ...metadata
    };

    console.log('📝 Final payment data:', {
      amount,
      currency,
      email,
      customerName,
      phone,
      callbackUrl: callback_url,
      metadata: finalMetadata
    });

    // Log callback URL explicitly
    if (callback_url) {
      console.log('✅ Using callback URL from frontend:', callback_url);
    } else {
      console.log('⚠️ No callback URL provided, service will generate one');
    }

    // Create order with "unpaid" status BEFORE payment initialization
    let createdOrder = null;
    
    if (customerOrderData) {
      try {
        console.log('📦 Creating order with unpaid status...');
        console.log('📋 Received order data:', JSON.stringify(customerOrderData, null, 2));
        
        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        // Prepare affiliate snapshot if exists
        let affiliateData = null;
        if (customerOrderData.affiliate) {
          const Affiliation = require('../Models/Affiliation');
          const affiliateDoc = await Affiliation.findById(customerOrderData.affiliate);
          if (affiliateDoc) {
            affiliateData = {
              firstName: affiliateDoc.firstName,
              lastName: affiliateDoc.lastName,
              email: affiliateDoc.email,
              mobile: affiliateDoc.mobile,
              percent: affiliateDoc.percent,
              affiliateCode: affiliateDoc.affiliateCode,
              affiliateLink: affiliateDoc.affiliateLink
            };
            console.log('🤝 Affiliate data prepared:', affiliateData);
          }
        }

        // Prepare deliveryArea snapshot if exists
        let deliveryAreaData = null;
        if (customerOrderData.deliveryArea) {
          // deliveryArea might be ID or already an object
          if (typeof customerOrderData.deliveryArea === 'string') {
            const DeliveryMethod = require('../Models/DeliveryMethod');
            const deliveryAreaDoc = await DeliveryMethod.findById(customerOrderData.deliveryArea);
            if (deliveryAreaDoc) {
              deliveryAreaData = {
                locationAr: deliveryAreaDoc.locationAr || '',
                locationEn: deliveryAreaDoc.locationEn || '',
                price: deliveryAreaDoc.price || 0,
                estimatedDays: deliveryAreaDoc.estimatedDays || 0
              };
            }
          } else {
            // Already an object
            deliveryAreaData = customerOrderData.deliveryArea;
          }
          console.log('🚚 Delivery area data:', deliveryAreaData);
        }
        
        // Transform items to match Order model requirements
        const transformedItems = await Promise.all(customerOrderData.items.map(async (item) => {
          // Fetch product details if needed
          const product = await Product.findById(item.product).select('nameAr nameEn price sku images');
          
          if (!product) {
            throw new Error(`Product not found: ${item.product}`);
          }
          
          return {
            productId: item.product,
            productSnapshot: {
              nameAr: product.nameAr,
              nameEn: product.nameEn,
              price: product.price,
              images: product.images || []
            },
            name: product.nameEn || product.nameAr,
            sku: product.sku || '',
            quantity: item.quantity,
            price: product.price,
            totalPrice: product.price * item.quantity,
            selectedSpecifications: customerOrderData.cartItems?.find(ci => ci.product === item.product)?.selectedSpecifications || [],
            selectedColors: customerOrderData.cartItems?.find(ci => ci.product === item.product)?.selectedColors || []
          };
        }));
        
        // Calculate pricing
        const subtotal = transformedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const deliveryCost = deliveryAreaData?.price || 0;
        const discount = customerOrderData.pricing?.discount || 0;
        const total = subtotal + deliveryCost - discount;
        
        console.log('✅ Items transformed:', transformedItems);
        console.log('💰 Pricing calculated:', { subtotal, deliveryCost, discount, total });
        
        // Prepare order data with proper structure
        // Important: store must be an object with all required fields
        // AND store._id must be ObjectId for queries to work
        const mongoose = require('mongoose');
        const orderDataToSave = {
          orderNumber,
          store: customerOrderData.store ? {
            _id: new mongoose.Types.ObjectId(customerOrderData.store._id),
            id: new mongoose.Types.ObjectId(customerOrderData.store._id), // Keep both for compatibility
            nameAr: customerOrderData.store.nameAr,
            nameEn: customerOrderData.store.nameEn,
            logo: customerOrderData.store.logo,
            contact: customerOrderData.store.contact,
            slug: customerOrderData.store.slug
          } : {
            _id: new mongoose.Types.ObjectId(store._id),
            id: new mongoose.Types.ObjectId(store._id), // Keep both for compatibility
            nameAr: store.nameAr,
            nameEn: store.nameEn,
            logo: store.logo,
            contact: store.contact,
            slug: store.slug
          },
          // For guest checkout, save customer info from shippingAddress
          user: customerOrderData.user || {
            guest: true,
            firstName: customerOrderData.shippingAddress?.firstName || first_name,
            lastName: customerOrderData.shippingAddress?.lastName || last_name,
            email: customerOrderData.shippingAddress?.email || email,
            phone: customerOrderData.shippingAddress?.phone || phone
          },
          guestId: customerOrderData.user ? null : `guest-${Date.now()}`,
          items: transformedItems,
          totalPrice: total, // ✅ Total price including shipping and discount
          shippingAddress: customerOrderData.shippingAddress,
          billingAddress: customerOrderData.billingAddress,
          paymentInfo: {
            ...customerOrderData.paymentInfo,
            status: 'unpaid'
          },
          shippingInfo: customerOrderData.shippingInfo,
          pricing: { // ✅ Detailed pricing breakdown
            subtotal,
            tax: customerOrderData.pricing?.tax || 0,
            shipping: deliveryCost,
            discount,
            total
          },
          notes: customerOrderData.notes,
          isGift: customerOrderData.isGift || false,
          giftMessage: customerOrderData.giftMessage || '',
          coupon: customerOrderData.coupon || null, // ✅ Coupon if used
          affiliate: affiliateData, // ✅ Affiliate data if order via affiliate
          deliveryArea: deliveryAreaData || customerOrderData.deliveryArea, // ✅ Delivery area data
          currency: customerOrderData.currency || 'ILS',
          paymentStatus: 'unpaid',
          status: 'pending',
          paymentReference: null
        };
        
        console.log('🏪 Store data in order:', {
          _id: orderDataToSave.store._id,
          idType: orderDataToSave.store._id.constructor.name,
          nameEn: orderDataToSave.store.nameEn,
          slug: orderDataToSave.store.slug
        });
        
        console.log('💾 Saving order...');
        
        // Create order with unpaid status
        const newOrder = new Order(orderDataToSave);
        
        createdOrder = await newOrder.save();
        console.log('✅ Order created with unpaid status:', createdOrder.orderNumber);
        
        // Handle affiliate tracking if order is via affiliate
        if (customerOrderData.affiliate && affiliateData) {
          try {
            const Affiliation = require('../Models/Affiliation');
            const affiliateDoc = await Affiliation.findById(customerOrderData.affiliate);
            
            if (affiliateDoc) {
              // Update affiliate sales (will update when payment is confirmed)
              // For now, just add the tracking data
              const finalAmountPaid = subtotal - discount; // Amount before shipping
              const commissionEarned = (finalAmountPaid * affiliateDoc.percent / 100);
              
              console.log('🤝 Affiliate commission calculation:', {
                finalAmountPaid,
                affiliatePercent: affiliateDoc.percent,
                commissionEarned
              });
              
              createdOrder.affiliateTracking = {
                isAffiliateOrder: true,
                affiliateId: affiliateDoc._id,
                referralSource: customerOrderData.referralSource || 'direct_link',
                utmSource: customerOrderData.utmSource,
                utmMedium: customerOrderData.utmMedium,
                utmCampaign: customerOrderData.utmCampaign,
                clickTimestamp: customerOrderData.clickTimestamp ? new Date(customerOrderData.clickTimestamp) : null,
                orderTimestamp: new Date(),
                conversionTime: customerOrderData.clickTimestamp ? 
                  Math.round((new Date() - new Date(customerOrderData.clickTimestamp)) / (1000 * 60)) : null, // بالدقائق
                commissionEarned: commissionEarned,
                commissionPercentage: affiliateDoc.percent
              };
              
              await createdOrder.save();
              console.log('✅ Affiliate tracking added to order');
            }
          } catch (affiliateError) {
            console.error('⚠️ Error adding affiliate tracking:', affiliateError);
            // Don't fail the whole order creation, just log the error
          }
        }
        
        // Add order reference to metadata
        finalMetadata.orderId = createdOrder._id.toString();
        finalMetadata.orderNumber = createdOrder.orderNumber;
        
      } catch (orderError) {
        console.error('❌ Error creating order:', orderError);
        return res.status(500).json({
          success: false,
          message: 'Error creating order',
          messageAr: 'خطأ في إنشاء الطلب',
          error: orderError.message
        });
      }
    }

    // Use LahzaPaymentService to initialize payment
    const result = await LahzaPaymentService.initializePayment(storeId, {
      amount,
      currency: currency || 'ILS',
      email,
      customerName,
      customerPhone: phone,
      description: `Customer order payment - ${store.nameEn}`,
      metadata: finalMetadata,
      callbackUrl: callback_url  // Pass the callback URL from frontend
    });

    if (result.success) {
      // Update order with payment reference if order was created
      if (createdOrder) {
        createdOrder.paymentReference = result.data.reference;
        await createdOrder.save();
        console.log('✅ Order updated with payment reference:', result.data.reference);
        
        // Start background polling to auto-update order status
        console.log('🔄 Starting background polling for payment:', result.data.reference);
        PaymentPollingService.startPolling(
          storeId, 
          result.data.reference, 
          createdOrder._id.toString()
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        messageAr: 'تم تهيئة الدفع بنجاح',
        data: {
          ...result.data,
          orderId: createdOrder?._id,
          orderNumber: createdOrder?.orderNumber
        }
      });
    } else {
      // If payment initialization failed, delete the created order
      if (createdOrder) {
        await Order.findByIdAndDelete(createdOrder._id);
        console.log('🗑️ Deleted unpaid order due to payment initialization failure');
      }
      
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to initialize payment',
        messageAr: result.error || 'فشل في تهيئة الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Customer Lahza payment initialization error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      messageAr: 'خطأ في تهيئة الدفع',
      error: error.message
    });
  }
};

/**
 * Verify Lahza payment for customer
 */
exports.verifyCustomerPayment = async (req, res) => {
  try {
    console.log('🔍 Customer payment verification request');

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

    const { storeId, reference } = req.params;

    console.log('📋 Verification params:', { storeId, reference });

    // Verify store exists
    const store = await Store.findById(storeId).select('nameEn nameAr');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Use LahzaPaymentService to verify payment
    const result = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        messageAr: 'تم التحقق من الدفع بنجاح',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Payment verification failed',
        messageAr: result.error || 'فشل في التحقق من الدفع',
        error: result.error,
        details: result.details
      });
    }

  } catch (error) {
    console.error('❌ Customer Lahza payment verification error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      messageAr: 'خطأ في التحقق من الدفع',
      error: error.message
    });
  }
};

/**
 * Get payment status for customer
 */
exports.getCustomerPaymentStatus = async (req, res) => {
  try {
    const { storeId, reference } = req.params;

    console.log('📊 Getting customer payment status:', { storeId, reference });

    // Verify store exists
    const store = await Store.findById(storeId).select('nameEn nameAr');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Use LahzaPaymentService to get payment status
    const result = await LahzaPaymentService.getPaymentStatus(storeId, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        messageAr: 'تم جلب حالة الدفع بنجاح',
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
    console.error('❌ Get customer payment status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      messageAr: 'خطأ في الحصول على حالة الدفع',
      error: error.message
    });
  }
};

/**
 * Handle Lahza payment webhook for customer orders
 * This updates order status to "paid" when payment is successful
 */
exports.handleCustomerWebhook = async (req, res) => {
  try {
    console.log('🔔 Customer payment webhook received');
    console.log('Webhook data:', JSON.stringify(req.body, null, 2));

    const { storeId } = req.params;
    const webhookData = req.body;

    // Verify store exists
    const store = await Store.findById(storeId).select('nameEn nameAr');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Extract payment reference from webhook data
    const reference = webhookData.data?.reference || webhookData.reference;
    
    if (!reference) {
      console.error('❌ No reference found in webhook data');
      return res.status(400).json({
        success: false,
        message: 'No payment reference found in webhook data',
        messageAr: 'لم يتم العثور على مرجع الدفع في بيانات الـ webhook'
      });
    }

    console.log('📋 Processing webhook for reference:', reference);

    // Verify payment with Lahza
    const verificationResult = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (!verificationResult.success) {
      console.error('❌ Payment verification failed:', verificationResult.error);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        messageAr: 'فشل التحقق من الدفع',
        error: verificationResult.error
      });
    }

    const paymentStatus = verificationResult.data?.status;
    console.log('💳 Payment status:', paymentStatus);

    // Find order by payment reference
    const order = await Order.findOne({ paymentReference: reference });

    if (!order) {
      console.log('⚠️ No order found for reference:', reference);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but no order found',
        messageAr: 'تم استلام الـ webhook ولكن لم يتم العثور على طلب',
        event: webhookData.event,
        status: paymentStatus
      });
    }

    console.log('📦 Found order:', order.orderNumber);
    console.log('📊 Order current status:', {
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentReference: order.paymentReference
    });

    // Check if payment is successful
    if (paymentStatus === 'success' || paymentStatus === 'CAPTURED' || paymentStatus === 'paid') {
      console.log('✅ Payment is successful, updating order...');
      
      // Check if already paid
      if (order.paymentStatus === 'paid') {
        console.log('⚠️ Order already marked as paid');
        return res.status(200).json({
          success: true,
          message: 'Order already marked as paid',
          messageAr: 'الطلب مدفوع بالفعل',
          event: webhookData.event,
          status: paymentStatus,
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            status: order.status
          }
        });
      }
      
      // Update order status to paid
      order.paymentStatus = 'paid';
      order.status = 'processing'; // Move to processing after payment
      order.paidAt = new Date();
      
      console.log('💾 Saving order with new status...');
      const updatedOrder = await order.save();
      
      console.log('✅ Order updated successfully:', {
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt
      });
      
      // Update affiliate sales if this is an affiliate order
      if (updatedOrder.affiliate && updatedOrder.affiliateTracking?.affiliateId) {
        try {
          const Affiliation = require('../Models/Affiliation');
          const affiliateDoc = await Affiliation.findById(updatedOrder.affiliateTracking.affiliateId);
          
          if (affiliateDoc) {
            // Calculate amount paid (subtotal - discount, without shipping)
            const finalAmountPaid = (updatedOrder.pricing?.subtotal || 0) - (updatedOrder.pricing?.discount || 0);
            
            console.log('🤝 Updating affiliate sales:', {
              affiliateId: affiliateDoc._id,
              affiliateCode: affiliateDoc.affiliateCode,
              finalAmountPaid,
              commission: updatedOrder.affiliateTracking.commissionEarned
            });
            
            // Update affiliate sales
            await affiliateDoc.updateSales(finalAmountPaid, updatedOrder._id);
            
            console.log('✅ Affiliate sales updated successfully');
          }
        } catch (affiliateError) {
          console.error('⚠️ Error updating affiliate sales:', affiliateError);
          // Don't fail the webhook, just log the error
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Order marked as paid successfully',
        messageAr: 'تم تحديث الطلب إلى مدفوع بنجاح',
        event: webhookData.event,
        status: paymentStatus,
        order: {
          id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          paymentStatus: updatedOrder.paymentStatus,
          status: updatedOrder.status,
          paidAt: updatedOrder.paidAt
        }
      });
    } else {
      console.log('⚠️ Payment not successful, status:', paymentStatus);
      
      // Update order with failed payment
      order.paymentStatus = 'unpaid'; // Keep as unpaid, not failed
      await order.save();
      
      return res.status(200).json({
        success: true,
        message: 'Payment not successful, order remains unpaid',
        messageAr: 'الدفع غير ناجح، الطلب لا يزال غير مدفوع',
        event: webhookData.event,
        status: paymentStatus,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus
        }
      });
    }

  } catch (error) {
    console.error('❌ Customer webhook handling error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      messageAr: 'خطأ في معالجة الـ webhook',
      error: error.message
    });
  }
};

/**
 * Get active polling status
 */
exports.getPollingStatus = async (req, res) => {
  try {
    const activePolls = PaymentPollingService.getActivePolls();
    
    return res.status(200).json({
      success: true,
      message: 'Polling status retrieved successfully',
      messageAr: 'تم جلب حالة المراقبة بنجاح',
      activePolls: activePolls,
      totalActivePolls: activePolls.length
    });
  } catch (error) {
    console.error('❌ Get polling status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting polling status',
      messageAr: 'خطأ في جلب حالة المراقبة',
      error: error.message
    });
  }
};

/**
 * Start polling for payment status (checks every 10 seconds)
 * This automatically updates order to paid when payment succeeds
 */
exports.startPaymentPolling = async (req, res) => {
  try {
    console.log('🔄 Starting payment polling for reference');

    const { storeId, reference } = req.params;
    console.log('📋 Polling params:', { storeId, reference });

    // Verify store exists
    const store = await Store.findById(storeId).select('nameEn nameAr lahzaSecretKey');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        messageAr: 'المتجر غير موجود'
      });
    }

    // Find order by payment reference
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'لم يتم العثور على الطلب'
      });
    }

    // Check if already in final state
    if (order.paymentStatus === 'paid') {
      console.log('✅ Order already paid, stopping polling');
      return res.status(200).json({
        success: true,
        message: 'Order already paid',
        messageAr: 'الطلب مدفوع بالفعل',
        shouldContinuePolling: false,
        paymentStatus: 'paid',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          status: order.status
        }
      });
    }

    // Check payment status with Lahza
    console.log('🔍 Checking payment status with Lahza...');
    const verificationResult = await LahzaPaymentService.verifyPayment(storeId, reference);

    if (!verificationResult.success) {
      console.log('⚠️ Payment verification failed, continue polling');
      return res.status(200).json({
        success: true,
        message: 'Payment still pending',
        messageAr: 'الدفع لا يزال قيد الانتظار',
        shouldContinuePolling: true,
        paymentStatus: 'pending',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus
        }
      });
    }

    const paymentStatus = verificationResult.data?.status;
    console.log('💳 Payment status from Lahza:', paymentStatus);

    // Check if payment succeeded
    if (paymentStatus === 'success' || paymentStatus === 'CAPTURED' || paymentStatus === 'paid') {
      console.log('✅ Payment successful! Updating order...');
      
      order.paymentStatus = 'paid';
      order.status = 'processing';
      order.paidAt = new Date();
      await order.save();
      
      console.log('✅ Order updated to paid:', order.orderNumber);
      
      // Update affiliate sales if this is an affiliate order
      if (order.affiliate && order.affiliateTracking?.affiliateId) {
        try {
          const Affiliation = require('../Models/Affiliation');
          const affiliateDoc = await Affiliation.findById(order.affiliateTracking.affiliateId);
          
          if (affiliateDoc) {
            const finalAmountPaid = (order.pricing?.subtotal || 0) - (order.pricing?.discount || 0);
            
            console.log('🤝 Updating affiliate sales:', {
              affiliateId: affiliateDoc._id,
              finalAmountPaid,
              commission: order.affiliateTracking.commissionEarned
            });
            
            await affiliateDoc.updateSales(finalAmountPaid, order._id);
            console.log('✅ Affiliate sales updated successfully');
          }
        } catch (affiliateError) {
          console.error('⚠️ Error updating affiliate sales:', affiliateError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment successful, order updated to paid',
        messageAr: 'الدفع ناجح، تم تحديث الطلب إلى مدفوع',
        shouldContinuePolling: false,
        paymentStatus: 'paid',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          status: order.status,
          paidAt: order.paidAt
        }
      });
    } 
    // Check if payment failed
    else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'declined') {
      console.log('❌ Payment failed! Updating order...');
      
      order.paymentStatus = 'unpaid';
      order.status = 'cancelled';
      await order.save();
      
      console.log('❌ Order marked as failed:', order.orderNumber);

      return res.status(200).json({
        success: true,
        message: 'Payment failed',
        messageAr: 'فشل الدفع',
        shouldContinuePolling: false,
        paymentStatus: 'failed',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          status: order.status
        }
      });
    }
    // Payment still pending
    else {
      console.log('⏳ Payment still pending, continue polling...');
      
      return res.status(200).json({
        success: true,
        message: 'Payment still pending',
        messageAr: 'الدفع لا يزال قيد الانتظار',
        shouldContinuePolling: true,
        paymentStatus: 'pending',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus
        }
      });
    }

  } catch (error) {
    console.error('❌ Payment polling error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error checking payment status',
      messageAr: 'خطأ في التحقق من حالة الدفع',
      error: error.message,
      shouldContinuePolling: true // Continue polling on error
    });
  }
};

/**
 * Update order status by payment reference (frontend fallback)
 * This is used when webhook doesn't fire (e.g., on localhost)
 */
exports.updateOrderStatusByReference = async (req, res) => {
  try {
    console.log('📝 Update order status by reference request');

    const { storeId, reference } = req.params;
    console.log('📋 Params:', { storeId, reference });

    // Find order by payment reference
    const order = await Order.findOne({ paymentReference: reference, store: storeId });

    if (!order) {
      console.log('⚠️ No order found for reference:', reference);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        messageAr: 'لم يتم العثور على الطلب'
      });
    }

    console.log('📦 Found order:', order.orderNumber);

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      console.log('✅ Order already paid');
      return res.status(200).json({
        success: true,
        message: 'Order already marked as paid',
        messageAr: 'الطلب مدفوع بالفعل',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus
        }
      });
    }

    // Update to paid
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paidAt = new Date();

    await order.save();

    console.log('✅ Order updated to paid:', order.orderNumber);
    
    // Update affiliate sales if this is an affiliate order
    if (order.affiliate && order.affiliateTracking?.affiliateId) {
      try {
        const Affiliation = require('../Models/Affiliation');
        const affiliateDoc = await Affiliation.findById(order.affiliateTracking.affiliateId);
        
        if (affiliateDoc) {
          const finalAmountPaid = (order.pricing?.subtotal || 0) - (order.pricing?.discount || 0);
          
          console.log('🤝 Updating affiliate sales (frontend fallback):', {
            affiliateId: affiliateDoc._id,
            finalAmountPaid,
            commission: order.affiliateTracking.commissionEarned
          });
          
          await affiliateDoc.updateSales(finalAmountPaid, order._id);
          console.log('✅ Affiliate sales updated successfully');
        }
      } catch (affiliateError) {
        console.error('⚠️ Error updating affiliate sales:', affiliateError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order payment status updated successfully',
      messageAr: 'تم تحديث حالة دفع الطلب بنجاح',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paidAt: order.paidAt
      }
    });

  } catch (error) {
    console.error('❌ Update order status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
      messageAr: 'خطأ في تحديث حالة الطلب',
      error: error.message
    });
  }
};

