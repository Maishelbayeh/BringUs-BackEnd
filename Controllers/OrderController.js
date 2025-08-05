const Order = require('../Models/Order');
const User = require('../Models/User');
const Product = require('../Models/Product');
const Store = require('../Models/Store');
const mongoose = require('mongoose');

/**
 * Get all orders for a specific store, including customer info
 * @route GET /api/orders/store/:storeId
 */
exports.getOrdersByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    const orders = await Order.find({ 'store.id': new mongoose.Types.ObjectId(storeId) })
      .populate('store', 'nameAr nameEn phone slug')
      .populate('user', 'firstName lastName email phone')
      .populate('affiliate', 'firstName lastName email')
      .populate('deliveryArea', 'locationAr locationEn');

    // Shape the response for the frontend
    const shapedOrders = orders.map(order => ({
      id: order.orderNumber,
      storeName: order.store?.nameEn,
      storeId: order.store?._id,
      storePhone: order.store?.phone,
      storeUrl: order.store ? `/store/${order.store.slug}` : '',
      customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : '',
      customerPhone: order.user?.phone,
      customerEmail: order.user?.email,
      user: order.user ? {
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        phone: order.user.phone
      } : null,
      affiliate:
        order.affiliate &&
        order.affiliate.firstName &&
        order.affiliate.lastName &&
        order.affiliate.firstName.trim() !== '' &&
        order.affiliate.lastName.trim() !== ''
          ? `${order.affiliate.firstName} ${order.affiliate.lastName}`
          : 'لا يوجد',
      deliveryArea: order.deliveryArea ? {
        locationAr: order.deliveryArea.locationAr,
        locationEn: order.deliveryArea.locationEn,
        price: order.deliveryArea.price,
        estimatedDays: order.deliveryArea.estimatedDays
      } : null,
      currency: order.currency,
      price: order.pricing?.total,
      date: order.createdAt,
      paid: order.paymentInfo?.status === 'completed',
      status: order.status,
      itemsCount: order.items.length,
      notes: order.notes?.customer || order.notes?.admin || '',
      items: order.items.map(item => ({
        image: item.productSnapshot?.images?.[0],
        name: item.productSnapshot?.nameEn || item.name,
        quantity: item.quantity,
        unit: item.productSnapshot?.unit?.nameEn,
        pricePerUnit: item.price,
        total: item.totalPrice,
        color: item.productSnapshot?.color,
      })),
    }));
    res.json({ success: true, data: shapedOrders, count: shapedOrders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new order for a store
 * @route POST /api/orders/store/:storeId
 */
exports.createOrder = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    const {
      user, // user id
      items,
      shippingAddress,
      billingAddress,
      paymentInfo,
      shippingInfo,
      notes,
      isGift,
      giftMessage,
      coupon,
      affiliate: affiliateId,
      deliveryArea: deliveryAreaId,
      currency
    } = req.body;

    // جلب بيانات المتجر
    const storeDoc = await Store.findById(storeId);
    if (!storeDoc) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const storeSnapshot = {
      id: storeDoc._id,
      nameAr: storeDoc.nameAr,
      nameEn: storeDoc.nameEn,
      phone: storeDoc.contact?.phone,
      slug: storeDoc.slug
    };

    // جلب بيانات المستخدم
    const foundUser = await User.findById(user);
    if (!foundUser) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    const userSnapshot = {
      id: foundUser._id,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      email: foundUser.email,
      phone: foundUser.phone
    };

    // Prepare affiliate snapshot
    let affiliateData = null;
    if (affiliateId) {
      const affiliateDoc = await require('../Models/Affiliation').findById(affiliateId);
      if (affiliateDoc) {
        affiliateData = {
          id: affiliateDoc._id.toString(),
          snapshot: {
            firstName: affiliateDoc.firstName,
            lastName: affiliateDoc.lastName,
            email: affiliateDoc.email,
            mobile: affiliateDoc.mobile,
            percent: affiliateDoc.percent,
            affiliateCode: affiliateDoc.affiliateCode,
            affiliateLink: affiliateDoc.affiliateLink
          }
        };
      }
    }

    // Prepare deliveryArea snapshot
    let deliveryAreaData = null;
    if (deliveryAreaId) {
      const deliveryAreaDoc = await require('../Models/DeliveryMethod').findById(deliveryAreaId);
      if (deliveryAreaDoc) {
        deliveryAreaData = {
          id: deliveryAreaDoc._id.toString(),
          snapshot: {
            locationAr: deliveryAreaDoc.locationAr,
            locationEn: deliveryAreaDoc.locationEn,
            price: deliveryAreaDoc.price,
            estimatedDays: deliveryAreaDoc.estimatedDays
          }
        };
      }
    }

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.product} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${product.nameEn} is not available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.nameEn}. Available: ${product.stock}` });
      }
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      processedItems.push({
        productId: product._id.toString(),
        productSnapshot: {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          images: product.images,
          price: product.price,
          unit: product.unit,
          color: product.color,
          sku: product.sku || '',
        },
        name: product.nameEn,
        sku: product.sku || '',
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal,
        variant: item.variant || {}
      });
      // Update product stock
      product.stock -= item.quantity;
      product.soldCount += item.quantity;
      await product.save();
    }

    // حساب التوتال كوست بدقة
    const tax = subtotal * 0.1; // 10% tax (يمكنك تعديله)
    const deliveryCost = deliveryAreaData?.snapshot?.price || 0;
    const discount = coupon ? (subtotal * coupon.discount / 100) : 0;
    const total = subtotal + tax + deliveryCost - discount;

    const order = await Order.create({
      store: storeSnapshot,
      user: userSnapshot,
      items: processedItems,
      shippingAddress,
      billingAddress,
      paymentInfo,
      shippingInfo,
      pricing: {
        subtotal,
        tax,
        shipping: deliveryCost,
        discount,
        total
      },
      notes,
      isGift,
      giftMessage,
      coupon,
      affiliate: affiliateData,
      deliveryArea: deliveryAreaData,
      currency
    });

    // تحديث عمولة الأفلييت إذا كان الطلب عن طريقه
    if (affiliateId && affiliateData) {
      const Affiliation = require('../Models/Affiliation');
      const affiliateDoc = await Affiliation.findById(affiliateId);
      if (affiliateDoc) {
        // استخدم الميثود الجاهز
        await affiliateDoc.updateSales(total, order._id);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
      totalCost: total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update order status
 * @route PUT /api/orders/:orderId/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    // Validate status
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: pending, shipped, delivered, cancelled' 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Update order status
    order.status = status;
    
    // Add admin notes if provided
    if (notes) {
      order.notes = {
        ...order.notes,
        admin: notes
      };
    }

    // Set delivery date if status is delivered
    if (status === 'delivered') {
      order.actualDeliveryDate = new Date();
    }

    // Handle cancellation
    if (status === 'cancelled' && order.status !== 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user?.id || 'system';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order status',
      error: error.message 
    });
  }
};

/**
 * Update payment status
 * @route PUT /api/orders/:orderId/payment-status
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    if (!paymentStatus) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment status is required' 
      });
    }

    // Validate payment status
    const validPaymentStatuses = ['pending', 'paid', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment status. Must be one of: pending, paid, refunded' 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;
    
    // Add admin notes if provided
    if (notes) {
      order.notes = {
        ...order.notes,
        admin: notes
      };
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating payment status',
      error: error.message 
    });
  }
}; 