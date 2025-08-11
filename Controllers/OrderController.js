const Order = require('../Models/Order');
const User = require('../Models/User');
const Product = require('../Models/Product');
const Store = require('../Models/Store');
const mongoose = require('mongoose');

/**
 * Helper function to validate product stock availability for both general stock and specification quantities
 * @param {Object} product - The product document
 * @param {Number} quantity - Quantity to check
 * @param {Array} selectedSpecifications - Array of selected specifications
 * @returns {Object} - Validation result with success status and message
 */
const validateProductStock = (product, quantity, selectedSpecifications = []) => {
  // التحقق من أن الكمية موجبة
  if (quantity <= 0) {
    return {
      success: false,
      message: `Invalid quantity: ${quantity}. Quantity must be greater than 0.`
    };
  }

  // Check general stock
  if (product.stock < quantity) {
    return {
      success: false,
      message: `Insufficient general stock for ${product.nameEn}. Available: ${product.stock}, Requested: ${quantity}`
    };
  }
  
  // Check specification quantities if specifications are selected
  if (selectedSpecifications && selectedSpecifications.length > 0) {
    console.log(`🔍 Validating ${selectedSpecifications.length} specifications for ${product.nameEn}`);
    console.log(`📋 Product has ${product.specificationValues?.length || 0} specification values`);
    
    // Call debug function for detailed analysis
    debugSpecificationMatching(product, selectedSpecifications);
    
    // Log all available specifications for debugging
    if (product.specificationValues && product.specificationValues.length > 0) {
      console.log('📋 Available specifications in product:');
      product.specificationValues.forEach((spec, index) => {
        console.log(`  ${index + 1}. ID: ${spec.specificationId}, ValueID: ${spec.valueId}, Title: ${spec.title}, Value: ${spec.value}, Quantity: ${spec.quantity}`);
      });
    }
    
    for (const selectedSpec of selectedSpecifications) {
      console.log(`🔍 Looking for specification: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
      
      // Try different matching strategies
      let specValue = null;
      
      // Strategy 1: Exact string match
      specValue = product.specificationValues.find(spec => 
        spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
        spec.valueId === selectedSpec.valueId
      );
      
      // Strategy 2: If not found, try ObjectId comparison
      if (!specValue) {
        specValue = product.specificationValues.find(spec => 
          spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
          spec.valueId.toString() === selectedSpec.valueId.toString()
        );
      }
      
      // Strategy 3: If still not found, try loose matching
      if (!specValue) {
        specValue = product.specificationValues.find(spec => 
          (spec.specificationId.toString() === selectedSpec.specificationId.toString() ||
           spec.specificationId.toString() === selectedSpec.specificationId) &&
          (spec.valueId === selectedSpec.valueId ||
           spec.valueId.toString() === selectedSpec.valueId.toString())
        );
      }
      
      if (!specValue) {
        console.error(`❌ Specification not found!`);
        console.error(`   Looking for: ID=${selectedSpec.specificationId} (${typeof selectedSpec.specificationId}), ValueID=${selectedSpec.valueId} (${typeof selectedSpec.valueId})`);
        console.error(`   Available specifications:`);
        product.specificationValues.forEach((spec, index) => {
          console.error(`     ${index + 1}. ID: ${spec.specificationId} (${typeof spec.specificationId}), ValueID: ${spec.valueId} (${typeof spec.valueId})`);
        });
        
        return {
          success: false,
          message: `Specification not found for product ${product.nameEn}. Specification ID: ${selectedSpec.specificationId}, Value ID: ${selectedSpec.valueId}. Available specifications: ${product.specificationValues.map(s => `${s.specificationId}:${s.valueId}`).join(', ')}`
        };
      }
      
      console.log(`✅ Found specification: "${specValue.title} (${specValue.value})" with quantity: ${specValue.quantity}`);
      
      if (specValue.quantity < quantity) {
        return {
          success: false,
          message: `Insufficient stock for specification "${specValue.title} (${specValue.value})" of ${product.nameEn}. Available: ${specValue.quantity}, Requested: ${quantity}`
        };
      }
      
      console.log(`✅ Specification "${specValue.title} (${specValue.value})" has sufficient stock: ${specValue.quantity} >= ${quantity}`);
    }
  } else {
    console.log(`📦 No specifications selected for ${product.nameEn}, only general stock validation`);
  }
  
  console.log(`✅ Stock validation passed for ${product.nameEn}`);
  return { success: true };
};

/**
 * Helper function to reduce product stock from both general stock and specification quantities
 * @param {Object} product - The product document
 * @param {Number} quantity - Quantity to reduce
 * @param {Array} selectedSpecifications - Array of selected specifications
 */
const reduceProductStock = async (product, quantity, selectedSpecifications = []) => {
  try {
    // التحقق من أن الكمية موجبة
    if (quantity <= 0) {
      console.warn(`Warning: Attempting to reduce stock with invalid quantity: ${quantity}`);
      return;
    }

    // Reduce from general stock
    if (product.stock >= quantity) {
      product.stock -= quantity;
      product.soldCount += quantity;
      console.log(`✅ Reduced general stock for ${product.nameEn}: ${quantity} units`);
    } else {
      console.error(`❌ Error: Insufficient general stock for ${product.nameEn}. Available: ${product.stock}, Requested: ${quantity}`);
      throw new Error(`Insufficient general stock for ${product.nameEn}`);
    }
    
    // Reduce from specification quantities if specifications are selected
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      console.log(`📦 Processing ${selectedSpecifications.length} specifications for ${product.nameEn}`);
      
      for (const selectedSpec of selectedSpecifications) {
        console.log(`🔍 Looking for specification to reduce: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
        
        // Try different matching strategies (same as validateProductStock)
        let specValue = null;
        
        // Strategy 1: Exact string match
        specValue = product.specificationValues.find(spec => 
          spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
          spec.valueId === selectedSpec.valueId
        );
        
        // Strategy 2: If not found, try ObjectId comparison
        if (!specValue) {
          specValue = product.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
            spec.valueId.toString() === selectedSpec.valueId.toString()
          );
        }
        
        // Strategy 3: If still not found, try loose matching
        if (!specValue) {
          specValue = product.specificationValues.find(spec => 
            (spec.specificationId.toString() === selectedSpec.specificationId.toString() ||
             spec.specificationId.toString() === selectedSpec.specificationId) &&
            (spec.valueId === selectedSpec.valueId ||
             spec.valueId.toString() === selectedSpec.valueId.toString())
          );
        }
        
        if (specValue) {
          if (specValue.quantity >= quantity) {
            specValue.quantity -= quantity;
            console.log(`✅ Reduced specification stock: ${specValue.title} (${specValue.value}) - ${quantity} units`);
          } else {
            console.error(`❌ Error: Insufficient specification stock for ${specValue.title} (${specValue.value}). Available: ${specValue.quantity}, Requested: ${quantity}`);
            throw new Error(`Insufficient specification stock for ${specValue.title} (${specValue.value})`);
          }
        } else {
          console.error(`❌ Error: Specification not found for reduction: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
          console.error(`   Available specifications:`);
          product.specificationValues.forEach((spec, index) => {
            console.error(`     ${index + 1}. ID: ${spec.specificationId}, ValueID: ${spec.valueId}`);
          });
          throw new Error(`Specification not found for reduction: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
        }
      }
    } else {
      console.log(`📦 No specifications selected for ${product.nameEn}, only general stock reduced`);
    }
    
    await product.save();
    console.log(`💾 Stock updated successfully for ${product.nameEn}`);
    
  } catch (error) {
    console.error(`❌ Error reducing stock for ${product.nameEn}:`, error.message);
    throw error;
  }
};

/**
 * Helper function to restore product stock to both general stock and specification quantities
 * @param {Object} product - The product document
 * @param {Number} quantity - Quantity to restore
 * @param {Array} selectedSpecifications - Array of selected specifications
 */
const restoreProductStock = async (product, quantity, selectedSpecifications = []) => {
  try {
    // التحقق من أن الكمية موجبة
    if (quantity <= 0) {
      console.warn(`Warning: Attempting to restore stock with invalid quantity: ${quantity}`);
      return;
    }

    // Restore to general stock
    product.stock += quantity;
    product.soldCount = Math.max(0, product.soldCount - quantity);
    console.log(`✅ Restored general stock for ${product.nameEn}: +${quantity} units`);
    
    // Restore to specification quantities if specifications are selected
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      console.log(`📦 Restoring ${selectedSpecifications.length} specifications for ${product.nameEn}`);
      
      for (const selectedSpec of selectedSpecifications) {
        console.log(`🔍 Looking for specification to restore: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
        
        // Try different matching strategies (same as other functions)
        let specValue = null;
        
        // Strategy 1: Exact string match
        specValue = product.specificationValues.find(spec => 
          spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
          spec.valueId === selectedSpec.valueId
        );
        
        // Strategy 2: If not found, try ObjectId comparison
        if (!specValue) {
          specValue = product.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
            spec.valueId.toString() === selectedSpec.valueId.toString()
          );
        }
        
        // Strategy 3: If still not found, try loose matching
        if (!specValue) {
          specValue = product.specificationValues.find(spec => 
            (spec.specificationId.toString() === selectedSpec.specificationId.toString() ||
             spec.specificationId.toString() === selectedSpec.specificationId) &&
            (spec.valueId === selectedSpec.valueId ||
             spec.valueId.toString() === selectedSpec.valueId.toString())
          );
        }
        
        if (specValue) {
          specValue.quantity += quantity;
          console.log(`✅ Restored specification stock: ${specValue.title} (${specValue.value}) +${quantity} units`);
        } else {
          console.warn(`⚠️ Warning: Specification not found for restoration: ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
          console.warn(`   Available specifications:`);
          product.specificationValues.forEach((spec, index) => {
            console.warn(`     ${index + 1}. ID: ${spec.specificationId}, ValueID: ${spec.valueId}`);
          });
        }
      }
    } else {
      console.log(`📦 No specifications to restore for ${product.nameEn}, only general stock restored`);
    }
    
    await product.save();
    console.log(`💾 Stock restoration completed successfully for ${product.nameEn}`);
    
  } catch (error) {
    console.error(`❌ Error restoring stock for ${product.nameEn}:`, error.message);
    throw error;
  }
};

/**
 * Helper function to get detailed stock status for a product
 * @param {Object} product - The product document
 * @returns {Object} - Detailed stock status
 */
const getProductStockStatus = (product) => {
  const status = {
    productId: product._id,
    productName: product.nameEn,
    generalStock: {
      available: product.stock,
      sold: product.soldCount,
      lowStockThreshold: product.lowStockThreshold,
      status: product.stock === 0 ? 'out_of_stock' : 
              product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock'
    },
    specifications: []
  };

  // Add specification stock details
  if (product.specificationValues && product.specificationValues.length > 0) {
    status.specifications = product.specificationValues.map(spec => ({
      specificationId: spec.specificationId,
      title: spec.title,
      value: spec.value,
      valueId: spec.valueId,
      quantity: spec.quantity,
      price: spec.price,
      status: spec.quantity === 0 ? 'out_of_stock' : 
              spec.quantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock'
    }));
  }

  return status;
};

/**
 * Helper function to debug specification matching
 * @param {Object} product - The product document
 * @param {Array} selectedSpecifications - Array of selected specifications
 */
const debugSpecificationMatching = (product, selectedSpecifications) => {
  console.log('\n🔍 DEBUG: Specification Matching Analysis');
  console.log('='.repeat(50));
  console.log(`Product: ${product.nameEn} (${product._id})`);
  console.log(`Product has ${product.specificationValues?.length || 0} specification values`);
  
  if (product.specificationValues && product.specificationValues.length > 0) {
    console.log('\n📋 Available specifications in product:');
    product.specificationValues.forEach((spec, index) => {
      console.log(`  ${index + 1}. ID: ${spec.specificationId} (${typeof spec.specificationId}), ValueID: ${spec.valueId} (${typeof spec.valueId}), Title: ${spec.title}, Value: ${spec.value}, Quantity: ${spec.quantity}`);
    });
  }
  
  if (selectedSpecifications && selectedSpecifications.length > 0) {
    console.log('\n🎯 Selected specifications from request:');
    selectedSpecifications.forEach((selectedSpec, index) => {
      console.log(`  ${index + 1}. ID: ${selectedSpec.specificationId} (${typeof selectedSpec.specificationId}), ValueID: ${selectedSpec.valueId} (${typeof selectedSpec.valueId})`);
    });
    
    console.log('\n🔍 Matching attempts:');
    selectedSpecifications.forEach((selectedSpec, index) => {
      console.log(`\n  Attempt ${index + 1}: Looking for ID=${selectedSpec.specificationId}, ValueID=${selectedSpec.valueId}`);
      
      // Try all matching strategies
      let found = false;
      
      // Strategy 1: Exact string match
      const match1 = product.specificationValues.find(spec => 
        spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
        spec.valueId === selectedSpec.valueId
      );
      if (match1) {
        console.log(`    ✅ Strategy 1 (Exact string): FOUND - ${match1.title} (${match1.value})`);
        found = true;
      } else {
        console.log(`    ❌ Strategy 1 (Exact string): NOT FOUND`);
      }
      
      // Strategy 2: ObjectId comparison
      const match2 = product.specificationValues.find(spec => 
        spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
        spec.valueId.toString() === selectedSpec.valueId.toString()
      );
      if (match2 && !found) {
        console.log(`    ✅ Strategy 2 (ObjectId): FOUND - ${match2.title} (${match2.value})`);
        found = true;
      } else if (!found) {
        console.log(`    ❌ Strategy 2 (ObjectId): NOT FOUND`);
      }
      
      // Strategy 3: Loose matching
      const match3 = product.specificationValues.find(spec => 
        (spec.specificationId.toString() === selectedSpec.specificationId.toString() ||
         spec.specificationId.toString() === selectedSpec.specificationId) &&
        (spec.valueId === selectedSpec.valueId ||
         spec.valueId.toString() === selectedSpec.valueId.toString())
      );
      if (match3 && !found) {
        console.log(`    ✅ Strategy 3 (Loose): FOUND - ${match3.title} (${match3.value})`);
        found = true;
      } else if (!found) {
        console.log(`    ❌ Strategy 3 (Loose): NOT FOUND`);
      }
      
      if (!found) {
        console.log(`    💥 NO MATCH FOUND for this specification!`);
      }
    });
  }
  
  console.log('='.repeat(50) + '\n');
};

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
      .populate('store', 'nameAr nameEn whatsappNumber slug')
      .populate('user', 'firstName lastName email phone')
      .populate('affiliate', 'firstName lastName email')
      .populate('deliveryArea', 'locationAr locationEn price estimatedDays');

    // Shape the response for the frontend
    const shapedOrders = orders.map(order => ({
      id: order.orderNumber,
      storeName: order.store?.nameEn,
      storeId: order.store?._id,
      storePhone: order.store?.whatsappNumber,
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
        locationAr: order.deliveryArea.locationAr || '',
        locationEn: order.deliveryArea.locationEn || '',
        price: order.deliveryArea.price || 0,
        estimatedDays: order.deliveryArea.estimatedDays || 0
      } : null,

      currency: order.currency,
      price: order.pricing?.total,
      date: order.createdAt,
      paid: order.paymentStatus === 'paid',
      status: order.status,
      itemsCount: order.items.length,
      notes: order.notes?.customer || order.notes?.admin || '',
      items: order.items.map(item => ({
        image: item.productSnapshot?.images?.[0],
        name: item.productSnapshot?.nameEn || item.productSnapshot?.nameAr,
        quantity: item.quantity,
        unit: item.productSnapshot?.unit?.nameEn,
        pricePerUnit: item.price,
        total: item.totalPrice,
        color: item.productSnapshot?.color,
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      })),
    }));



    res.json({ success: true, data: shapedOrders, count: shapedOrders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new order for a store (supports both authenticated users and guests)
 * @route POST /api/orders/store/:storeId
 */
exports.createOrder = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    const {
      user, // user id (optional for guests)
      guestId, // guest id (for guest users)
      items,
      cartItems, // cart items with specifications and colors
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
      phone: storeDoc.whatsappNumber,
      slug: storeDoc.slug
    };

    // جلب بيانات المستخدم أو إنشاء بيانات الضيف
    let userSnapshot;
    
    if (user) {
      // للمستخدمين المسجلين
      const foundUser = await User.findById(user);
      if (!foundUser) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }
      userSnapshot = {
        id: foundUser._id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        phone: foundUser.phone
      };
    } else if (guestId) {
      // للضيوف
      userSnapshot = {
        id: null,
        firstName: shippingAddress?.firstName || 'Guest',
        lastName: shippingAddress?.lastName || 'User',
        email: shippingAddress?.email || billingAddress?.email || 'guest@example.com',
        phone: shippingAddress?.phone || billingAddress?.phone || ''
      };
    } else {
      return res.status(400).json({ success: false, message: 'Either user ID or guest ID is required' });
    }

    // Prepare affiliate snapshot
    let affiliateData = null;
    if (affiliateId) {
      const affiliateDoc = await require('../Models/Affiliation').findById(affiliateId);
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
      }
    }

    // Prepare deliveryArea snapshot
    let deliveryAreaData = null;
    if (deliveryAreaId) {
      const deliveryAreaDoc = await require('../Models/DeliveryMethod').findById(deliveryAreaId);
      if (deliveryAreaDoc) {
        deliveryAreaData = {
          locationAr: deliveryAreaDoc.locationAr || '',
          locationEn: deliveryAreaDoc.locationEn || '',
          price: deliveryAreaDoc.price || 0,
          estimatedDays: deliveryAreaDoc.estimatedDays || 0
        };
      }
    }

    let discount = 0;
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
      
      // Find corresponding cart item to get specifications and colors
      const cartItem = cartItems ? cartItems.find(cartItem => 
        cartItem.product === item.product && 
        cartItem.quantity === item.quantity
      ) : null;
      
      // Validate stock availability for both general stock and specifications
      const stockValidation = validateProductStock(product, item.quantity, cartItem ? cartItem.selectedSpecifications || [] : []);
      if (!stockValidation.success) {
        return res.status(400).json({ success: false, message: stockValidation.message });
      }
      
      // Get wholesaler discount if user is wholesaler
      let wholesalerDiscount = null;
      if (user) {
        wholesalerDiscount = await getWholesalerDiscount(user, storeId);
        console.log('wholesalerDiscount',wholesalerDiscount);
      }
      
      // Calculate the current price based on user role
      let currentPrice = 0;
      if (wholesalerDiscount ) {
        console.log('wholesalerDiscount',wholesalerDiscount);
        discount = wholesalerDiscount.discount;
        console.log('discount',discount);
        currentPrice = product.compareAtPrice || product.price;
        console.log(`💰 Applied wholesaler pricing: ${currentPrice} (compareAtPrice) for ${product.nameEn}`);
      } else {
        // Calculate the current price (considering any discounts)
        discount = product.salePercentage > 0 ? product.salePercentage : 0;
        currentPrice = product.isOnSale && product.salePercentage > 0 ? 
          product.price - (product.price * product.salePercentage / 100) : product.price;
        console.log(`💰 Applied regular pricing: ${currentPrice} for ${product.nameEn}`);
      }
      
      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;
      processedItems.push({
        productId: product._id.toString(),
        productSnapshot: {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          images: product.images,
          price: currentPrice,
          unit: product.unit,
          color: product.color,
          sku: product.sku || '',
        },
        name: product.nameEn,
        sku: product.sku || '',
        quantity: item.quantity,
        price: currentPrice,
        totalPrice: itemTotal,
        variant: item.variant || {},
        // Copy specifications and colors from cart item
        selectedSpecifications: cartItem ? cartItem.selectedSpecifications || [] : [],
        selectedColors: cartItem ? cartItem.selectedColors || [] : []
      });
      // Update product stock from both general stock and specification quantities
      await reduceProductStock(product, item.quantity, cartItem ? cartItem.selectedSpecifications || [] : []);
    }
    console.log('discount',discount);
    // حساب التوتال كوست بدقة

    const deliveryCost = deliveryAreaData?.price || 0;
    const Finaldiscount = discount > 0 ? (subtotal * discount / 100) : 0;
    console.log('Finaldiscount',Finaldiscount);
    console.log('subtotal',subtotal);
    const total = subtotal + deliveryCost - Finaldiscount;
    console.log('total',total);

    const order = await Order.create({
      totalPrice:total,
      store: storeSnapshot,
      user: userSnapshot,
      items: processedItems,
      shippingAddress,
      billingAddress,
      paymentInfo,
      shippingInfo,
      pricing: {
        subtotal,
        tax:0,
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
    console.log('order',order.pricing);
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
 * Create an order directly from a cart (supports both authenticated users and guests)
 * @route POST /api/orders/store/:storeId/from-cart
 */
exports.createOrderFromCart = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    
    const {
      user, // user id (optional for guests)
      guestId, // guest id (for guest users)
      cartId, // cart id to get items from
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

    // جلب بيانات المستخدم أو إنشاء بيانات الضيف
    let userSnapshot;
    
    if (user) {
      // للمستخدمين المسجلين
      const foundUser = await User.findById(user);
      if (!foundUser) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }
      userSnapshot = {
        id: foundUser._id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        phone: foundUser.phone
      };
    } else if (guestId) {
      // للضيوف
      userSnapshot = {
        id: null,
        firstName: shippingAddress?.firstName || 'Guest',
        lastName: shippingAddress?.lastName || 'User',
        email: shippingAddress?.email || billingAddress?.email || 'guest@example.com',
        phone: shippingAddress?.phone || billingAddress?.phone || ''
      };
    } else {
      return res.status(400).json({ success: false, message: 'Either user ID or guest ID is required' });
    }

    // جلب بيانات السلة
    const Cart = require('../Models/Cart');
    const cart = await Cart.findById(cartId).populate('items.product');
    if (!cart) {
      return res.status(400).json({ success: false, message: 'Cart not found' });
    }

    // التحقق من أن السلة تخص المستخدم والمتجر الصحيح
    if (cart.user?.toString() !== user || cart.store?.toString() !== storeId) {
      return res.status(403).json({ success: false, message: 'Cart does not belong to this user or store' });
    }

    // Prepare affiliate snapshot
    let affiliateData = null;
    if (affiliateId) {
      const affiliateDoc = await require('../Models/Affiliation').findById(affiliateId);
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
      }
    }

    // Prepare deliveryArea snapshot
    let deliveryAreaData = null;
    if (deliveryAreaId) {
      const deliveryAreaDoc = await require('../Models/DeliveryMethod').findById(deliveryAreaId);
      if (deliveryAreaDoc) {
        deliveryAreaData = {
          locationAr: deliveryAreaDoc.locationAr || '',
          locationEn: deliveryAreaDoc.locationEn || '',
          price: deliveryAreaDoc.price || 0,
          estimatedDays: deliveryAreaDoc.estimatedDays || 0
        };
      }
    }

    // Validate and process cart items
    let subtotal = 0;
    const processedItems = [];
    
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found for cart item` });
      }
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${product.nameEn} is not available` });
      }
      
      // Validate stock availability for both general stock and specifications
      const stockValidation = validateProductStock(product, cartItem.quantity, cartItem.selectedSpecifications || []);
      if (!stockValidation.success) {
        return res.status(400).json({ success: false, message: stockValidation.message });
      }
      
      // Get wholesaler discount if user is wholesaler
      let wholesalerDiscount = null;
      if (user) {
        wholesalerDiscount = await getWholesalerDiscount(user, storeId);
      }
      let pushPrice = 0;
      // Calculate the current price based on user role
      let currentPrice = cartItem.priceAtAdd; // Default to cart price
      if (wholesalerDiscount && wholesalerDiscount.isVerified) {
        pushPrice = product.compareAtPrice || product.price;
        // Use compareAtPrice for verified wholesalers
        currentPrice = product.compareAtPrice || product.price;
        console.log(`💰 Applied wholesaler pricing: ${currentPrice} (compareAtPrice) for ${product.nameEn}`);
      } else {
        // Use cart price or calculate regular price
        currentPrice = cartItem.priceAtAdd;
        console.log(`💰 Applied cart pricing: ${currentPrice} for ${product.nameEn}`);
      }
      
      const itemTotal = currentPrice * cartItem.quantity;
      subtotal += itemTotal;
      
      processedItems.push({
        productId: product._id.toString(),
        productSnapshot: {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          images: product.images,
          price: pushPrice,
          unit: product.unit,
          color: product.color,
          sku: product.sku || '',
        },
        name: product.nameEn,
        sku: product.sku || '',
        quantity: cartItem.quantity,
        price: cartItem.priceAtAdd,
        totalPrice: itemTotal,
        variant: cartItem.variant || {},
        // Copy specifications and colors from cart item
        selectedSpecifications: cartItem.selectedSpecifications || [],
        selectedColors: cartItem.selectedColors || []
      });
      
      // Update product stock from both general stock and specification quantities
      await reduceProductStock(product, cartItem.quantity, cartItem.selectedSpecifications || []);
    }

    // حساب التوتال كوست بدقة
    const tax = subtotal  // 10% tax (يمكنك تعديله)
    const deliveryCost = deliveryAreaData?.price || 0;
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

    // Clear the cart after successful order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully from cart',
      data: order,
      totalCost: total
    });
  } catch (error) {
    console.error('Create order from cart error:', error);
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

    // Check if orderId is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(orderId);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: orderId });
    }

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
    const validPaymentStatuses = ['unpaid', 'paid'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment status. Must be one of: unpaid, paid' 
      });
    }

    // Check if orderId is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(orderId);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: orderId });
    }

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

/**
 * Get order details by ID or order number
 * @route GET /api/orders/details/:identifier
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeItems = 'true', includeUser = 'true', includeStore = 'true' } = req.query;

    if (!identifier) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order identifier (ID or order number) is required' 
      });
    }

    // Check if identifier is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(identifier);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: identifier });
    }

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check permissions - user can only access their own orders unless they're admin
    const isOwner = order.user?.id === req.user._id.toString() || 
                   order.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isStoreOwner = req.user.role === 'store_owner' && 
                        order.store?.id === req.store?._id?.toString();

    if (!isOwner && !isAdmin && !isStoreOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own orders.' 
      });
    }

    // Shape the response based on query parameters
    const response = {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      notes: order.notes,
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate
    };

    // Add pricing information
    if (order.pricing) {
      response.pricing = {
        subtotal: order.pricing.subtotal,
        tax: order.pricing.tax,
        shipping: order.pricing.shipping,
        discount: order.pricing.discount,
        total: order.pricing.total
      };
    }

    // Add shipping information
    if (order.shippingAddress) {
      response.shippingAddress = order.shippingAddress;
    }

    if (order.billingAddress) {
      response.billingAddress = order.billingAddress;
    }

    if (order.shippingInfo) {
      response.shippingInfo = order.shippingInfo;
    }

    if (order.paymentInfo) {
      response.paymentInfo = order.paymentInfo;
    }

    // Add delivery area information
    if (order.deliveryArea) {
      response.deliveryArea = order.deliveryArea;
    }

    // Add affiliate information
    if (order.affiliate) {
      response.affiliate = order.affiliate;
    }

    // Add coupon information
    if (order.coupon) {
      response.coupon = order.coupon;
    }

    // Add items if requested
    if (includeItems === 'true') {
      response.items = order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        variant: item.variant,
        productSnapshot: item.productSnapshot,
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      }));
      response.itemsCount = order.items.length;
    }

    // Add user information if requested
    if (includeUser === 'true' && order.user) {
      response.user = {
        id: order.user.id || order.user._id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        phone: order.user.phone
      };
    }

    // Add store information if requested
    if (includeStore === 'true' && order.store) {
      response.store = {
        id: order.store.id || order.store._id,
        nameAr: order.store.nameAr,
        nameEn: order.store.nameEn,
        phone: order.store.whatsappNumber,
        slug: order.store.slug
      };
    }

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order details',
      error: error.message 
    });
  }
};


/**
 * Get orders for the authenticated user
 * @route GET /api/orders/my-orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from token
    const storeId = req.user.storeId || req.user.store; // Get storeId from token
    
    console.log('🔍 getMyOrders - userId from token:', userId);
    console.log('🔍 getMyOrders - storeId from token:', storeId);
    console.log('🔍 getMyOrders - req.user:', req.user);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Build query based on user role and store
    let query = {};
    
    if (req.user.role === 'client' || req.user.role === 'wholesaler'|| req.user.role === 'affiliate') {
      // For clients, get orders from their store AND for their user ID
      if (storeId) {
        query['store.id'] = storeId;
        query['user.id'] = userId; // Add user filter for clients
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Store ID not found in user token' 
        });
      }
    } else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // For admins, get orders from their stores (all orders in the store)
      if (storeId) {
        query['store.id'] = storeId;
      } else {
        // If no specific store, get all orders (for superadmin)
        if (req.user.role !== 'superadmin') {
          return res.status(400).json({ 
            success: false, 
            message: 'Store ID not found in user token' 
          });
        }
      }
    }

    console.log('🔍 getMyOrders - query:', query);
    
    // Get orders
    let orders = await Order.find(query)
      .populate('store', 'nameAr nameEn whatsappNumber slug')
      .populate('deliveryArea', 'locationAr locationEn price estimatedDays')
      .sort({ createdAt: -1 }); // Latest orders first
    
    console.log('🔍 getMyOrders - found orders count:', orders.length);

    // If no orders found, create a test order for the current user (for testing purposes)
    if (orders.length === 0) {
      console.log('🔍 getMyOrders - No orders found for user in store, creating test order...');
      
      try {
        // Get user details
        const currentUser = await User.findById(userId);
        if (currentUser) {
     
          
          // Add the test order to the results and populate it
          orders = await Order.find({ _id: testOrder._id })
            .populate('store', 'nameAr nameEn whatsappNumber slug')
            .populate('deliveryArea', 'locationAr locationEn price estimatedDays');
        }
      } catch (error) {
        console.log('🔍 getMyOrders - Error creating test order:', error.message);
      }
    }

    // Shape the response for the frontend
    const shapedOrders = orders.map(order => ({
      id: order.orderNumber,
      orderNumber: order.orderNumber,
      storeName: order.store?.nameEn,
      storeId: order.store?._id,
      storePhone: order.store?.whatsappNumber,
      storeUrl: order.store ? `/store/${order.store.slug}` : '',
      currency: order.currency,
      price: order.pricing?.total,
      date: order.createdAt,
      paid: order.paymentStatus === 'paid',
      status: order.status,
      itemsCount: order.items.length,
      notes: order.notes?.customer || order.notes?.admin || '',
      deliveryArea: order.deliveryArea ? {
        locationAr: order.deliveryArea.locationAr || '',
        locationEn: order.deliveryArea.locationEn || '',
        price: order.deliveryArea.price || 0,
        estimatedDays: order.deliveryArea.estimatedDays || 0
      } : null,
      items: order.items.map(item => ({
        image: item.productSnapshot?.images?.[0],
        name: item.productSnapshot?.nameEn || item.name,
        quantity: item.quantity,
        unit: item.productSnapshot?.unit?.nameEn,
        pricePerUnit: item.price,
        total: item.totalPrice,
        color: item.productSnapshot?.color,
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      })),
      // Add detailed information
      pricing: order.pricing ? {
        subtotal: order.pricing.subtotal,
        tax: order.pricing.tax,
        shipping: order.pricing.shipping,
        discount: order.pricing.discount,
        total: order.pricing.total
      } : null,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentInfo: order.paymentInfo,
      shippingInfo: order.shippingInfo,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      affiliate: order.affiliate,
      coupon: order.coupon,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({ 
      success: true, 
      data: shapedOrders, 
      count: shapedOrders.length 
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user orders',
      error: error.message 
    });
  }
};

/**
 * Get a specific order for the authenticated user
 * @route GET /api/orders/my-orders/:orderId
 */
exports.getMyOrderById = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from token
    const storeId = req.user.storeId || req.user.store; // Get storeId from token
    const { orderId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Build query based on user role and store
    let query = {};
    
    if (req.user.role === 'client') {
      // For clients, get orders from their store AND for their user ID
      if (storeId) {
        query['store.id'] = storeId;
        query['user.id'] = userId; // Add user filter for clients
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Store ID not found in user token' 
        });
      }
    } else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // For admins, get orders from their stores (all orders in the store)
      if (storeId) {
        query['store.id'] = storeId;
      } else {
        // If no specific store, get all orders (for superadmin)
        if (req.user.role !== 'superadmin') {
          return res.status(400).json({ 
            success: false, 
            message: 'Store ID not found in user token' 
          });
        }
      }
    }

    // Check if orderId is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      // If it's a valid ObjectId, search by _id and store/user
      query._id = orderId;
      order = await Order.findOne(query);
    } else {
      // If it's not a valid ObjectId, search by orderNumber and store/user
      query.orderNumber = orderId;
      order = await Order.findOne(query);
    }

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or access denied' 
      });
    }

    // Shape the response
    const shapedOrder = {
      id: order._id,
      orderNumber: order.orderNumber,
      storeName: order.store?.nameEn,
      storeId: order.store?._id,
      storePhone: order.store?.whatsappNumber,
      storeUrl: order.store ? `/store/${order.store.slug}` : '',
      currency: order.currency,
      price: order.pricing?.total,
      date: order.createdAt,
      paid: order.paymentStatus === 'paid',
      status: order.status,
      itemsCount: order.items.length,
      notes: order.notes?.customer || order.notes?.admin || '',
      deliveryArea: order.deliveryArea ? {
        locationAr: order.deliveryArea.locationAr || '',
        locationEn: order.deliveryArea.locationEn || '',
        price: order.deliveryArea.price || 0,
        estimatedDays: order.deliveryArea.estimatedDays || 0
      } : null,
      items: order.items.map(item => ({
        productId: item.productId,
        image: item.productSnapshot?.images?.[0],
        name: item.productSnapshot?.nameEn || item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.productSnapshot?.unit?.nameEn,
        pricePerUnit: item.price,
        total: item.totalPrice,
        color: item.productSnapshot?.color,
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || [],
        variant: item.variant,
        productSnapshot: item.productSnapshot
      })),
      // Add detailed information
      pricing: order.pricing ? {
        subtotal: order.pricing.subtotal,
        tax: order.pricing.tax,
        shipping: order.pricing.shipping,
        discount: order.pricing.discount,
        total: order.pricing.total
      } : null,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentInfo: order.paymentInfo,
      shippingInfo: order.shippingInfo,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      affiliate: order.affiliate,
      coupon: order.coupon,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.json({
      success: true,
      message: 'Order details retrieved successfully',
      data: shapedOrder
    });

  } catch (error) {
    console.error('Get my order by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order details',
      error: error.message 
    });
  }
};

/**
 * Get orders by customer ID
 * @route GET /api/orders/customer/:customerId
 */
exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10, status, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('🔍 getOrdersByCustomerId - customerId:', customerId);
    console.log('🔍 getOrdersByCustomerId - storeId from query:', storeId);
    console.log('🔍 getOrdersByCustomerId - User making request:', req.user.email, 'Role:', req.user.role);

    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer ID is required' 
      });
    }

    // Validate customerId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid customer ID format' 
      });
    }

    // Build query
    let query = { 'user.id': new mongoose.Types.ObjectId(customerId) };

    // Add store filter if provided
    if (storeId) {
      query['store.id'] = new mongoose.Types.ObjectId(storeId);
      console.log('🔍 getOrdersByCustomerId - Added store filter:', storeId);
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
      console.log('🔍 getOrdersByCustomerId - Added status filter:', status);
    }

    console.log('🔍 getOrdersByCustomerId - Final query:', JSON.stringify(query, null, 2));

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate('store', 'nameAr nameEn whatsappNumber slug')
      .populate('deliveryArea', 'locationAr locationEn price estimatedDays')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Calculate spending statistics - use the same query as the main query to ensure consistency
    const spendingQuery = { 'user.id': new mongoose.Types.ObjectId(customerId) };
    if (storeId) {
      spendingQuery['store.id'] = new mongoose.Types.ObjectId(storeId);
    }
    
    const allCustomerOrders = await Order.find(spendingQuery);
    const totalSpending = allCustomerOrders.reduce((sum, order) => {
      const orderTotal = order.pricing?.total || 0;
      console.log('🔍 Order total for spending calculation:', orderTotal, 'Order ID:', order._id);
      return sum + orderTotal;
    }, 0);
    const averageSpending = allCustomerOrders.length > 0 ? totalSpending / allCustomerOrders.length : 0;
    const lastOrderDate = allCustomerOrders.length > 0 
      ? new Date(Math.max(...allCustomerOrders.map(order => new Date(order.createdAt))))
      : null;

    console.log('🔍 getOrdersByCustomerId - Found orders count:', orders.length);
    console.log('🔍 getOrdersByCustomerId - Total orders:', total);
    console.log('🔍 getOrdersByCustomerId - All customer orders for spending calculation:', allCustomerOrders.length);
    console.log('🔍 getOrdersByCustomerId - Total spending:', totalSpending);
    console.log('🔍 getOrdersByCustomerId - Average spending:', averageSpending);
    console.log('🔍 getOrdersByCustomerId - Last order date:', lastOrderDate);
    
    // Debug: Check first order pricing structure
    if (allCustomerOrders.length > 0) {
      const firstOrder = allCustomerOrders[0];
      console.log('🔍 First order pricing structure:', {
        orderId: firstOrder._id,
        pricing: firstOrder.pricing,
        total: firstOrder.pricing?.total,
        hasPricing: !!firstOrder.pricing
      });
    }

    // Shape the response for the frontend
    const shapedOrders = orders.map(order => ({
      id: order.orderNumber,
      orderNumber: order.orderNumber,
      storeName: order.store?.nameEn,
      storeId: order.store?._id,
      storePhone: order.store?.whatsappNumber,
      storeUrl: order.store ? `/store/${order.store.slug}` : '',
      currency: order.currency,
      price: order.pricing?.total,
      date: order.createdAt,
      paid: order.paymentStatus === 'paid',
      status: order.status,
      itemsCount: order.items.length,
      notes: order.notes?.customer || order.notes?.admin || '',
      deliveryArea: order.deliveryArea ? {
        locationAr: order.deliveryArea.locationAr || '',
        locationEn: order.deliveryArea.locationEn || '',
        price: order.deliveryArea.price || 0,
        estimatedDays: order.deliveryArea.estimatedDays || 0
      } : null,
      items: order.items.map(item => ({
        image: item.productSnapshot?.images?.[0],
        name: item.productSnapshot?.nameEn || item.name,
        quantity: item.quantity,
        unit: item.productSnapshot?.unit?.nameEn,
        pricePerUnit: item.price,
        total: item.totalPrice,
        color: item.productSnapshot?.color,
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      })),
      // Add detailed information
      pricing: order.pricing ? {
        subtotal: order.pricing.subtotal,
        tax: order.pricing.tax,
        shipping: order.pricing.shipping,
        discount: order.pricing.discount,
        total: order.pricing.total
      } : null,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentInfo: order.paymentInfo,
      shippingInfo: order.shippingInfo,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      cancelledAt: order.cancelledAt,
      cancelledBy: order.cancelledBy,
      cancellationReason: order.cancellationReason,
      affiliate: order.affiliate,
      coupon: order.coupon,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json({ 
      success: true, 
      data: shapedOrders, 
      count: shapedOrders.length,
      total,
      customerStats: {
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        averageSpending: parseFloat(averageSpending.toFixed(2)),
        lastOrderDate: lastOrderDate,
        totalOrders: allCustomerOrders.length
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get orders by customer ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders by customer ID',
      error: error.message 
    });
  }
};

/**
 * Create a guest order (for non-authenticated users)
 * @route POST /api/orders/store/:storeId/guest
 */
exports.createGuestOrder = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }
    
    // Debug: Log the request body for troubleshooting
    console.log('🔍 DEBUG: Guest Order Request Body:', JSON.stringify(req.body, null, 2));
    
    const {
      guestId, // guest id (required for guest orders)
      items,
      cartItems, // cart items with specifications and colors
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

    if (!guestId) {
      return res.status(400).json({ success: false, message: 'Guest ID is required for guest orders' });
    }

    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.email) {
      return res.status(400).json({ success: false, message: 'Shipping address with firstName, lastName, and email is required for guest orders' });
    }

    // جلب بيانات المتجر
    const storeDoc = await Store.findById(storeId);
    if (!storeDoc) {
      return res.status(400).json({ success: false, message: 'Store not found' });
    }
    const storeSnapshot = {
      id: storeDoc._id,
      nameAr: storeDoc.nameAr,
      nameEn: storeDoc.nameEn,
      phone: storeDoc.whatsappNumber,
      slug: storeDoc.slug
    };

    // إنشاء بيانات الضيف
    const userSnapshot = {
      id: null,
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      email: shippingAddress.email,
      phone: shippingAddress.phone || billingAddress?.phone || ''
    };

    // Prepare affiliate snapshot
    let affiliateData = null;
    if (affiliateId) {
      const affiliateDoc = await require('../Models/Affiliation').findById(affiliateId);
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
      }
    }

    // Prepare deliveryArea snapshot
    let deliveryAreaData = null;
    if (deliveryAreaId) {
      const deliveryAreaDoc = await require('../Models/DeliveryMethod').findById(deliveryAreaId);
      if (deliveryAreaDoc) {
        deliveryAreaData = {
          locationAr: deliveryAreaDoc.locationAr || '',
          locationEn: deliveryAreaDoc.locationEn || '',
          price: deliveryAreaDoc.price || 0,
          estimatedDays: deliveryAreaDoc.estimatedDays || 0
        };
      }
    }

    let discount = 0;
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
      
      // Find corresponding cart item to get specifications and colors
      const cartItem = cartItems ? cartItems.find(cartItem => 
        cartItem.product === item.product && 
        cartItem.quantity === item.quantity
      ) : null;
      
      // Validate stock availability for both general stock and specifications
      const stockValidation = validateProductStock(product, item.quantity, cartItem ? cartItem.selectedSpecifications || [] : []);
      if (!stockValidation.success) {
        return res.status(400).json({ success: false, message: stockValidation.message });
      }
      
      // Get wholesaler discount if user is wholesaler
      let wholesalerDiscount = null;
      if (user) {
        wholesalerDiscount = await getWholesalerDiscount(user, storeId);
      }
      // Calculate the current price based on user role
      let currentPrice = 0;
      if (wholesalerDiscount && wholesalerDiscount.isVerified) {
        discount = wholesalerDiscount.discount;
        console.log('wholesalerDiscount',discount);
        currentPrice = product.compareAtPrice || product.price;
        console.log(`💰 Applied wholesaler pricing: ${currentPrice} (compareAtPrice) for ${product.nameEn}`);
      } else {
        discount = product.salePercentage > 0 ? product.salePercentage : 0;
        // Calculate the current price (considering any discounts)
        currentPrice = product.isOnSale && product.salePercentage > 0 ? 
          product.price - (product.price * product.salePercentage / 100) : product.price;
        console.log(`💰 Applied regular pricing: ${currentPrice} for ${product.nameEn}`);
      }
      
      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;
      processedItems.push({
        productId: product._id.toString(),
        productSnapshot: {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          images: product.images,
          price: currentPrice,
          unit: product.unit,
          color: product.color,
          sku: product.sku || '',
        },
        name: product.nameEn,
        sku: product.sku || '',
        quantity: item.quantity,
        price: currentPrice,
        totalPrice: itemTotal,
        variant: item.variant || {},
        // Copy specifications and colors from cart item
        selectedSpecifications: cartItem ? cartItem.selectedSpecifications || [] : [],
        selectedColors: cartItem ? cartItem.selectedColors || [] : []
      });
      // Update product stock from both general stock and specification quantities
      await reduceProductStock(product, item.quantity, cartItem ? cartItem.selectedSpecifications || [] : []);
    }
    console.log('discount',discount);

    // حساب التوتال كوست بدقة
    const deliveryCost = deliveryAreaData?.price || 0;
    const Finaldiscount = discount > 0 ? (subtotal * discount / 100) : 0;
    console.log('Finaldiscount',Finaldiscount);
    console.log('subtotal',subtotal);
    const total = subtotal   + deliveryCost - Finaldiscount;

    const order = await Order.create({
      store: storeSnapshot,
      user: userSnapshot,
      guestId: guestId, // إضافة guestId للطلب
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
      message: 'Guest order created successfully',
      data: order,
      totalCost: total
    });
  } catch (error) {
    console.error('Create guest order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete an order (Admin only or order owner)
 * @route DELETE /api/orders/:orderId
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Check if orderId is a valid ObjectId or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      // If it's a valid ObjectId, search by _id
      order = await Order.findById(orderId);
    } else {
      // If it's not a valid ObjectId, search by orderNumber
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check permissions - only admin or order owner can delete
    const isOwner = order.user?.id === userId || order.user?._id?.toString() === userId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const isStoreOwner = userRole === 'store_owner' && 
                        order.store?.id === req.store?._id?.toString();

    if (!isOwner && !isAdmin && !isStoreOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete your own orders or must be admin.' 
      });
    }

    // Additional checks for order deletion
    if (order.status === 'delivered' || order.status === 'shipped') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete orders that are already shipped or delivered' 
      });
    }

    // Restore product stock if order is being deleted
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        try {
          const product = await Product.findById(item.productId);
          if (product) {
            // Restore stock from both general stock and specification quantities
            await restoreProductStock(product, item.quantity, item.selectedSpecifications || []);
          }
        } catch (error) {
          console.log('Error restoring product stock:', error.message);
        }
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(order._id);

    res.json({
      success: true,
      message: 'Order deleted successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting order',
      error: error.message 
    });
  }
};

/**
 * Get detailed stock status for a product
 * @route GET /api/orders/store/:storeId/product/:productId/stock-status
 */
exports.getProductStockStatus = async (req, res) => {
  try {
    const { storeId, productId } = req.params;
    
    if (!storeId || !productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID and Product ID are required' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // التحقق من أن المنتج ينتمي للمتجر
    if (product.store.toString() !== storeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Product does not belong to this store' 
      });
    }

    const stockStatus = getProductStockStatus(product);
    
    res.status(200).json({
      success: true,
      message: 'Stock status retrieved successfully',
      data: stockStatus
    });
    
  } catch (error) {
    console.error('Get product stock status error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Helper function to get wholesaler discount for a user
 * @param {String} userId - User ID
 * @param {String} storeId - Store ID
 * @returns {Object} - Wholesaler discount info or null
 */
const getWholesalerDiscount = async (userId, storeId) => {
  try {
    const Wholesaler = require('../Models/Wholesaler');
    
    // البحث عن التاجر باستخدام userId
    const wholesaler = await Wholesaler.findOne({
      userId: userId,
      store: storeId,
    });
    
    console.log('Searching for wholesaler with userId:', userId);
    console.log('Found wholesaler:', wholesaler);
    
    if (wholesaler) {
      return {
        discount: wholesaler.discount,
        wholesalerId: wholesaler._id,
        businessName: wholesaler.businessName,
        isVerified: wholesaler.isVerified
      };
    }
    
         // إذا لم يجد باستخدام userId، جرب البحث باستخدام email
     const User = require('../Models/User');
     const user = await User.findById(userId).select('email');
     if (user && user.email) {
       console.log('Trying to find wholesaler by email:', user.email);
       const wholesalerByEmail = await Wholesaler.findOne({
         email: user.email,
         store: storeId,
         status: 'Active',
         isVerified: true
       });
       
       console.log('Found wholesaler by email:', wholesalerByEmail);
       
       if (wholesalerByEmail) {
         return {
           discount: wholesalerByEmail.discount,
           wholesalerId: wholesalerByEmail._id,
           businessName: wholesalerByEmail.businessName,
           isVerified: wholesalerByEmail.isVerified
         };
       }
     }
    if (wholesaler) {
      return {
        discount: wholesaler.discount,
        wholesalerId: wholesaler._id,
        businessName: wholesaler.businessName,
        isVerified: wholesaler.isVerified
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting wholesaler discount:', error);
    return null;
  }
};

/**
 * Get wholesaler discount for a user
 * @route GET /api/orders/store/:storeId/wholesaler-discount/:userId
 */
exports.getWholesalerDiscount = async (req, res) => {
  try {
    const { storeId, userId } = req.params;
    
    if (!storeId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID and User ID are required' 
      });
    }

    const discountInfo = await getWholesalerDiscount(userId, storeId);
    
    if (discountInfo) {
      res.status(200).json({
        success: true,
        message: 'Wholesaler discount retrieved successfully',
        data: {
          discount: discountInfo.discount,
          wholesalerId: discountInfo.wholesalerId,
          businessName: discountInfo.businessName,
          isVerified: discountInfo.isVerified,
          discountRate: `${discountInfo.discount}%`
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No active wholesaler found for this user'
      });
    }
    
  } catch (error) {
    console.error('Get wholesaler discount error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Helper function to calculate final price with wholesaler discount
 * @param {Object} product - Product document
 * @param {String} userId - User ID
 * @param {String} storeId - Store ID
 * @param {Number} quantity - Quantity
 * @returns {Object} - Price calculation result
 */
const calculateFinalPrice = async (product, userId, storeId, quantity = 1) => {
  try {
    // Get wholesaler discount if user is wholesaler
    let wholesalerDiscount = null;
    if (userId) {
      wholesalerDiscount = await getWholesalerDiscount(userId, storeId);
    }
    
    let currentPrice = 0;
    let priceType = 'regular';
    let discountInfo = null;
    
    if (wholesalerDiscount && wholesalerDiscount.isVerified) {
      // Use compareAtPrice for verified wholesalers
      currentPrice = product.compareAtPrice || product.price;
      priceType = 'wholesaler';
      discountInfo = {
        discount: wholesalerDiscount.discount,
        businessName: wholesalerDiscount.businessName,
        wholesalerId: wholesalerDiscount.wholesalerId
      };
      console.log(`💰 Applied wholesaler pricing: ${currentPrice} (compareAtPrice) for ${product.nameEn}`);
    } else {
      // Calculate the current price (considering any discounts)
      currentPrice = product.isOnSale && product.salePercentage > 0 ? 
        product.price - (product.price * product.salePercentage / 100) : product.price;
      priceType = 'regular';
      console.log(`💰 Applied regular pricing: ${currentPrice} for ${product.nameEn}`);
    }
    
    const itemTotal = currentPrice * quantity;
    
    return {
      unitPrice: currentPrice,
      totalPrice: itemTotal,
      priceType: priceType,
      discountInfo: discountInfo,
      quantity: quantity,
      originalPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      isOnSale: product.isOnSale,
      salePercentage: product.salePercentage
    };
    
  } catch (error) {
    console.error('Error calculating final price:', error);
    // Fallback to regular price
    const currentPrice = product.price;
    const itemTotal = currentPrice * quantity;
    
    return {
      unitPrice: currentPrice,
      totalPrice: itemTotal,
      priceType: 'regular',
      discountInfo: null,
      quantity: quantity,
      originalPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      isOnSale: product.isOnSale,
      salePercentage: product.salePercentage
    };
  }
};

/**
 * Calculate final price with wholesaler discount
 * @route POST /api/orders/store/:storeId/calculate-price
 */
exports.calculateFinalPrice = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { userId, items } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store ID is required' 
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required' 
      });
    }

    const results = [];
    let totalSubtotal = 0;
    let wholesalerDiscount = null;
    
    // Get wholesaler discount once if user is provided
    if (userId) {
      wholesalerDiscount = await getWholesalerDiscount(userId, storeId);
    }
    
    for (const item of items) {
      const { productId, quantity = 1 } = item;
      
      if (!productId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product ID is required for each item' 
        });
      }
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with ID ${productId} not found` 
        });
      }
      
      if (!product.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: `Product ${product.nameEn} is not available` 
        });
      }
      
      const priceCalculation = await calculateFinalPrice(product, userId, storeId, quantity);
      totalSubtotal += priceCalculation.totalPrice;
      
      results.push({
        productId: product._id,
        productName: product.nameEn,
        quantity: quantity,
        ...priceCalculation
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Price calculation completed successfully',
      data: {
        items: results,
        subtotal: totalSubtotal,
        wholesalerDiscount: wholesalerDiscount ? {
          discount: wholesalerDiscount.discount,
          businessName: wholesalerDiscount.businessName,
          wholesalerId: wholesalerDiscount.wholesalerId,
          isVerified: wholesalerDiscount.isVerified
        } : null,
        summary: {
          totalItems: items.length,
          totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
          priceType: wholesalerDiscount && wholesalerDiscount.isVerified ? 'wholesaler' : 'regular'
        }
      }
    });
    
  } catch (error) {
    console.error('Calculate final price error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Helper function to check wholesaler status
 * @param {String} userId - User ID
 * @param {String} storeId - Store ID
 * @returns {Object} - Wholesaler status info
 */
const checkWholesalerStatus = async (userId, storeId) => {
  try {
    const Wholesaler = require('../Models/Wholesaler');
    const User = require('../Models/User');
    
    console.log('🔍 Checking wholesaler status for userId:', userId, 'storeId:', storeId);
    
    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return { isWholesaler: false, reason: 'User not found' };
    }
    
    console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });
    
    // Check if user role is wholesaler
    if (user.role !== 'wholesaler') {
      console.log('❌ User role is not wholesaler:', user.role);
      return { isWholesaler: false, reason: 'User role is not wholesaler' };
    }
    
    // Search for wholesaler record
    const wholesaler = await Wholesaler.findOne({
      userId: userId,
      store: storeId
    });
    
    console.log('🏪 Wholesaler record found:', wholesaler ? {
      id: wholesaler._id,
      status: wholesaler.status,
      isVerified: wholesaler.isVerified,
      discount: wholesaler.discount
    } : 'Not found');
    
    if (!wholesaler) {
      return { isWholesaler: false, reason: 'No wholesaler record found' };
    }
    
    if (wholesaler.status !== 'Active') {
      return { 
        isWholesaler: false, 
        reason: `Wholesaler status is ${wholesaler.status}` 
      };
    }
    
    if (!wholesaler.isVerified) {
      return { 
        isWholesaler: false, 
        reason: 'Wholesaler is not verified' 
      };
    }
    
    return {
      isWholesaler: true,
      wholesaler: {
        id: wholesaler._id,
        discount: wholesaler.discount,
        businessName: wholesaler.businessName,
        status: wholesaler.status,
        isVerified: wholesaler.isVerified
      }
    };
    
  } catch (error) {
    console.error('Error checking wholesaler status:', error);
    return { isWholesaler: false, reason: 'Error checking status' };
  }
};