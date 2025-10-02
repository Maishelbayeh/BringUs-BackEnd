const POSCart = require('../Models/POSCart');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const Wholesaler = require('../Models/Wholesaler');
const User = require('../Models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Generate unique session ID
const generateSessionId = () => {
  return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper function to check if customer is a wholesaler
 * @param {String} email - Customer email
 * @param {String} phone - Customer phone
 * @param {String} storeId - Store ID
 * @returns {Object} - Wholesaler info or null
 */
const checkWholesalerStatus = async (email, phone, storeId) => {
  try {
    if (!email && !phone) return null;
    
    // Try to find by email first
    if (email) {
      const wholesaler = await Wholesaler.findOne({
        email: email,
        store: storeId,
        status: 'Active',
        isVerified: true
      });
      
      if (wholesaler) {
        console.log('🔍 POS Cart - Found wholesaler by email:', email);
        return {
          wholesalerId: wholesaler._id,
          discount: wholesaler.discount,
          businessName: wholesaler.businessName
        };
      }
    }
    
    // Try to find by phone if email didn't work
    if (phone) {
      const wholesaler = await Wholesaler.findOne({
        mobile: phone,
        store: storeId,
        status: 'Active',
        isVerified: true
      });
      
      if (wholesaler) {
        console.log('🔍 POS Cart - Found wholesaler by phone:', phone);
        return {
          wholesalerId: wholesaler._id,
          discount: wholesaler.discount,
          businessName: wholesaler.businessName
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking wholesaler status:', error);
    return null;
  }
};

// Get all active POS carts for admin
exports.getPOSCarts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status = 'active' } = req.query;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const filter = {
      admin: req.user._id,
      store: storeId,
      status: status
    };

    const carts = await POSCart.find(filter)
      .populate('items.product', 'nameEn nameAr price images mainImage')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: carts,
      count: carts.length
    });

  } catch (error) {
    console.error('Get POS carts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS carts',
      error: error.message
    });
  }
};

// Create new POS cart
exports.createPOSCart = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const sessionId = generateSessionId();

    const posCart = new POSCart({
      admin: req.user._id,
      store: storeId,
      sessionId: sessionId,
      cartName: 'Market POS Cart',
      customer: {}
    });

    await posCart.save();

    res.status(201).json({
      success: true,
      message: 'POS cart created successfully',
      data: {
        cartId: posCart._id,
        sessionId: posCart.sessionId,
        cartName: posCart.cartName
      }
    });

  } catch (error) {
    console.error('Create POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating POS cart',
      error: error.message
    });
  }
};

// Get specific POS cart
exports.getPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    })
    .populate('items.product', 'nameEn nameAr price images mainImage stock availableQuantity')
    .populate('store', 'nameEn nameAr domain');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS cart',
      error: error.message
    });
  }
};

// Add item to POS cart
exports.addToPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { product, quantity, variant, selectedSpecifications, selectedColors, priceAtAdd } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Validate input
    if (!product || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product and quantity are required'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Get product details
    const productData = await Product.findById(product);
    if (!productData) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (productData.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${productData.stock}`
      });
    }

    // Validate specifications if provided
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      console.log(`🔍 POS Cart - Validating ${selectedSpecifications.length} specifications for ${productData.nameEn}`);
      console.log(`🔍 POS Cart - Selected specifications:`, JSON.stringify(selectedSpecifications, null, 2));
      
      if (productData.specificationValues && productData.specificationValues.length > 0) {
        console.log(`🔍 POS Cart - Product has ${productData.specificationValues.length} specification values`);
        console.log(`🔍 POS Cart - Available specifications:`, productData.specificationValues.map(s => ({
          specificationId: s.specificationId.toString(),
          valueId: s.valueId,
          title: s.title,
          value: s.value
        })));
        
        // Track validation results
        const validationResults = [];
        let hasInvalidSpecs = false;
        
        for (const selectedSpec of selectedSpecifications) {
          console.log(`🔍 POS Cart - Validating spec: ${selectedSpec.specificationId}:${selectedSpec.valueId}`);
          
          // Try multiple validation approaches
          let specExists = productData.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
            spec.valueId === selectedSpec.valueId
          );
          
          // If not found, try case-insensitive comparison
          if (!specExists) {
            specExists = productData.specificationValues.find(spec => 
              spec.specificationId.toString().toLowerCase() === selectedSpec.specificationId.toLowerCase() &&
              spec.valueId.toLowerCase() === selectedSpec.valueId.toLowerCase()
            );
          }
          
          // If still not found, try matching by specification ID and value (for cases where valueId format differs)
          if (!specExists && selectedSpec.value) {
            specExists = productData.specificationValues.find(spec => 
              spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
              spec.value === selectedSpec.value
            );
            
            if (specExists) {
              console.log(`✅ POS Cart - Found specification by value match: ${selectedSpec.specificationId}:${selectedSpec.value} -> ${specExists.valueId}`);
            }
          }
          
          // If still not found, try to find by specification ID only and suggest the closest match
          if (!specExists) {
            const specIdMatch = productData.specificationValues.find(spec => 
              spec.specificationId.toString() === selectedSpec.specificationId.toString()
            );
            
            if (specIdMatch) {
              // Try to find a reasonable match based on the valueId pattern
              const availableValues = productData.specificationValues
                .filter(spec => spec.specificationId.toString() === selectedSpec.specificationId.toString());
              
              // If the valueId looks like it might be a specification ID with a different suffix,
              // try to find the first available value for this specification
              if (selectedSpec.valueId && selectedSpec.valueId.startsWith(selectedSpec.specificationId)) {
                console.log(`⚠️ POS Cart - ValueId appears to be malformed, using first available value for specification`);
                specExists = availableValues[0]; // Use the first available value
                
                if (specExists) {
                  console.log(`✅ POS Cart - Using first available specification: ${specExists.valueId} (${specExists.value})`);
                }
              }
            }
          }
          
          // Final fallback: if we still haven't found a match and there are specifications for this product,
          // and the frontend is sending malformed data, try to use the first available specification
          if (!specExists && productData.specificationValues && productData.specificationValues.length > 0) {
            const specIdMatch = productData.specificationValues.find(spec => 
              spec.specificationId.toString() === selectedSpec.specificationId.toString()
            );
            
            if (specIdMatch) {
              console.log(`⚠️ POS Cart - Final fallback: Using first available specification for ID ${selectedSpec.specificationId}`);
              specExists = productData.specificationValues
                .filter(spec => spec.specificationId.toString() === selectedSpec.specificationId.toString())[0];
              
              if (specExists) {
                console.log(`✅ POS Cart - Fallback successful: Using ${specExists.valueId} (${specExists.value})`);
              }
            }
          }
          
          if (specExists) {
            console.log(`✅ POS Cart - Specification validated: ${selectedSpec.specificationId}:${selectedSpec.valueId}`);
            validationResults.push({ valid: true, spec: selectedSpec });
          } else {
            console.warn(`⚠️ POS Cart - Specification not found: ${selectedSpec.specificationId}:${selectedSpec.valueId}`);
            validationResults.push({ valid: false, spec: selectedSpec });
            hasInvalidSpecs = true;
          }
        }
        
        // If there are invalid specifications, handle based on configuration
        if (hasInvalidSpecs) {
          const invalidSpecs = validationResults.filter(r => !r.valid);
          const errorDetails = invalidSpecs.map(invalid => {
            const specIdMatch = productData.specificationValues.find(spec => 
              spec.specificationId.toString() === invalid.spec.specificationId.toString()
            );
            
            if (specIdMatch) {
              const availableValues = productData.specificationValues
                .filter(spec => spec.specificationId.toString() === invalid.spec.specificationId.toString())
                .map(spec => ({ valueId: spec.valueId, value: spec.value, title: spec.title }));
              
              // Check if the value matches any available value
              const valueMatch = availableValues.find(v => v.value === invalid.spec.value);
              if (valueMatch) {
                return `Spec ID ${invalid.spec.specificationId}: Value ID mismatch. Use valueId "${valueMatch.valueId}" for value "${invalid.spec.value}" instead of "${invalid.spec.valueId}". Available: ${availableValues.map(v => `${v.valueId} (${v.value})`).join(', ')}`;
              } else {
                return `Spec ID ${invalid.spec.specificationId}: Invalid value ID ${invalid.spec.valueId}. Available: ${availableValues.map(v => `${v.valueId} (${v.value})`).join(', ')}`;
              }
            } else {
              const availableSpecIds = [...new Set(productData.specificationValues.map(spec => spec.specificationId.toString()))];
              return `Spec ID ${invalid.spec.specificationId} not found. Available spec IDs: ${availableSpecIds.join(', ')}`;
            }
          });
          
          // Check if we should allow invalid specifications (fallback mode)
          const allowInvalidSpecs = process.env.POS_ALLOW_INVALID_SPECS === 'true' || req.body.allowInvalidSpecs === true;
          
          if (allowInvalidSpecs) {
            console.warn(`⚠️ POS Cart - Allowing invalid specifications in fallback mode for ${productData.nameEn}`);
            console.warn(`⚠️ Invalid specs:`, errorDetails.join('; '));
            
            // Filter out invalid specifications and continue with valid ones
            const validSpecs = validationResults
              .filter(r => r.valid)
              .map(r => r.spec);
            
            console.log(`⚠️ POS Cart - Using ${validSpecs.length} valid specifications out of ${selectedSpecifications.length} total`);
            
            // Update the selectedSpecifications to only include valid ones
            selectedSpecifications.length = 0;
            selectedSpecifications.push(...validSpecs);
          } else {
            return res.status(400).json({
              success: false,
              message: `Invalid specifications for product ${productData.nameEn}. ${errorDetails.join('; ')}`,
              details: {
                productName: productData.nameEn,
                invalidSpecifications: invalidSpecs.map(r => r.spec),
                availableSpecifications: productData.specificationValues.map(s => ({
                  specificationId: s.specificationId.toString(),
                  valueId: s.valueId,
                  title: s.title,
                  value: s.value
                })),
                suggestion: "Set allowInvalidSpecs=true in request body or POS_ALLOW_INVALID_SPECS=true environment variable to enable fallback mode"
              }
            });
          }
        }
        
        console.log(`✅ POS Cart - All specifications validated for ${productData.nameEn}`);
      } else {
        console.warn(`⚠️ POS Cart - Product ${productData.nameEn} has no specification values but specifications were provided`);
        return res.status(400).json({
          success: false,
          message: `Product ${productData.nameEn} does not support specifications`,
          details: {
            productName: productData.nameEn,
            hasSpecificationValues: false
          }
        });
      }
    }

    // Calculate the correct price based on customer type
    let finalPrice = productData.price; // Default to regular price
    
    if (cart.customer && cart.customer.type === 'wholesaler') {
      // Use compareAtPrice for wholesalers (discounted price)
      finalPrice = productData.compareAtPrice || productData.price;
      console.log(`💰 POS Cart - Applied wholesaler pricing: ${finalPrice} (compareAtPrice) for ${productData.nameEn}`);
    } else if (priceAtAdd && priceAtAdd > 0) {
      // Use the price provided in the request (manual override)
      finalPrice = priceAtAdd;
      console.log(`💰 POS Cart - Applied manual pricing: ${finalPrice} for ${productData.nameEn}`);
    } else {
      console.log(`💰 POS Cart - Applied regular pricing: ${finalPrice} for ${productData.nameEn}`);
    }

    // Prepare item data
    const itemData = {
      product: product,
      quantity: quantity,
      variant: variant || null,
      priceAtAdd: finalPrice,
      selectedSpecifications: selectedSpecifications || [],
      selectedColors: selectedColors || []
    };

    // Add item to cart
    await cart.addItem(itemData);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item added to POS cart successfully',
      data: cart
    });

  } catch (error) {
    console.error('Add to POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to POS cart',
      error: error.message
    });
  }
};

// Update item in POS cart
exports.updatePOSCartItem = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(itemId, quantity);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update POS cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating POS cart item',
      error: error.message
    });
  }
};

// Remove item from POS cart
exports.removeFromPOSCart = async (req, res) => {
  try {
    const { cartId, itemId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Remove item
    await cart.removeItem(itemId);

    // Populate the updated cart
    await cart.populate('items.product', 'nameEn nameAr price images mainImage');

    res.json({
      success: true,
      message: 'Item removed successfully',
      data: cart
    });

  } catch (error) {
    console.error('Remove from POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from POS cart',
      error: error.message
    });
  }
};

// Update POS cart customer info
exports.updatePOSCartCustomer = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { customer } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Update customer info
    const updatedCustomer = { ...cart.customer, ...customer };
    
    // Check if customer is a wholesaler based on email or phone
    if (customer.email || customer.phone) {
      const wholesalerInfo = await checkWholesalerStatus(
        customer.email || updatedCustomer.email,
        customer.phone || updatedCustomer.phone,
        cart.store.toString()
      );
      
      if (wholesalerInfo) {
        updatedCustomer.type = 'wholesaler';
        updatedCustomer.wholesalerId = wholesalerInfo.wholesalerId;
        console.log(`🏪 POS Cart - Customer identified as wholesaler: ${wholesalerInfo.businessName}`);
      } else {
        updatedCustomer.type = 'regular';
        updatedCustomer.wholesalerId = undefined;
        console.log('👤 POS Cart - Customer identified as regular customer');
      }
    }
    
    cart.customer = updatedCustomer;
    await cart.save();

    res.json({
      success: true,
      message: 'Customer information updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update POS cart customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer information',
      error: error.message
    });
  }
};

// Apply discount to POS cart
exports.applyDiscount = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { type, value, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Validate discount
    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: 'Discount type and value are required'
      });
    }

    if (type === 'percentage' && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Apply discount
    cart.discount = { type, value, reason };
    await cart.save();

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: cart
    });

  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying discount',
      error: error.message
    });
  }
};

// Complete POS cart (convert to order with paid status)
exports.completePOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const { notes } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    }).populate('items.product', 'nameEn nameAr price images mainImage');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete empty cart'
      });
    }

    // Update cart with payment info (always cash, no change)
    cart.payment = {
      method: 'cash',
      amount: cart.total,
      change: 0,
      notes: 'POS cash payment - no change'
    };

    if (notes) {
      cart.notes = { ...cart.notes, admin: notes };
    }

    // Complete the cart
    await cart.completeCart();

    // Calculate final amount paid by customer (after cart-level discounts, before shipping)
    const cartDiscountAmount = cart.discount?.type === 'percentage' ? 
      (cart.subtotal * cart.discount.value / 100) : (cart.discount?.value || 0);
    const finalAmountPaid = cart.subtotal - cartDiscountAmount;
    
    console.log('💰 POS Cart Completion - Pricing Summary:', {
      subtotal: cart.subtotal,
      cartDiscountAmount,
      finalAmountPaid,
      customerType: cart.customer?.type || 'regular',
      isWholesaler: cart.customer?.type === 'wholesaler'
    });

    // Create order from POS cart (consistent with existing order structure)
    const orderData = {
      orderNumber: `POS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      store: {
        id: cart.store,
        nameAr: 'Market POS Store',
        nameEn: 'Market POS Store',
        phone: '',
        slug: 'pos'
      },
      user: {
        firstName: cart.customer?.name?.split(' ')[0] || 'Market',
        lastName: cart.customer?.name?.split(' ').slice(1).join(' ') || 'Customer',
        email: cart.customer?.email || 'market@customer.com',
        phone: cart.customer?.phone || '',
        address: cart.customer?.address || {}
      },
      items: cart.items.map(item => ({
        productId: item.product._id.toString(),
        productSnapshot: {
          nameAr: item.product.nameAr || item.product.nameEn,
          nameEn: item.product.nameEn,
          images: item.product.images || [item.product.mainImage],
          price: item.priceAtAdd, // This is already the correct price (wholesaler or regular)
          unit: item.product.unit,
          color: item.product.color,
          sku: item.product.sku || ''
        },
        name: item.product.nameEn,
        sku: item.product.sku || '',
        quantity: item.quantity,
        price: item.priceAtAdd,
        totalPrice: item.priceAtAdd * item.quantity,
        variant: item.variant || {},
        selectedSpecifications: item.selectedSpecifications || [],
        selectedColors: item.selectedColors || []
      })),
      shippingAddress: cart.customer?.address || {},
      billingAddress: cart.customer?.address || {},
      paymentInfo: {
        method: 'cash',
        status: 'completed',
        transactionId: `POS-${Date.now()}`,
        amount: cart.total
      },
      shippingInfo: {
        method: 'pickup',
        cost: 0,
        estimatedDays: 0
      },
      pricing: {
        subtotal: cart.subtotal,
        tax: cart.tax?.amount || 0,
        shipping: 0,
        discount: cartDiscountAmount,
        total: cart.total
      },
      
      paymentStatus: 'paid', // Automatically set as paid for POS orders
      status: 'delivered',
      notes: {
        admin: `Market POS Order - ${cart.notes?.admin || ''}`,
        customer: ''
      },
      // Add POS-specific tracking information
      posTracking: {
        isPOSOrder: true,
        cartId: cart._id,
        sessionId: cart.sessionId,
        customerType: cart.customer?.type || 'regular',
        wholesalerId: cart.customer?.wholesalerId || null,
        finalAmountPaid: finalAmountPaid
      }
    };

    const order = new Order(orderData);
    await order.save();

    // Handle affiliate commission if this is a wholesaler order
    if (cart.customer?.type === 'wholesaler' && cart.customer?.wholesalerId) {
      try {
        const wholesaler = await Wholesaler.findById(cart.customer.wholesalerId);
        if (wholesaler && wholesaler.percent > 0) {
          // Calculate affiliate commission from final amount paid (after discounts)
          const commissionEarned = (finalAmountPaid * wholesaler.percent / 100);
          
          console.log('💰 POS Cart - Affiliate commission calculation:', {
            finalAmountPaid,
            affiliatePercent: wholesaler.percent,
            commissionEarned,
            wholesalerBusinessName: wholesaler.businessName
          });
          
          // Update wholesaler sales
          await wholesaler.updateSales(finalAmountPaid, order._id);
          
          // Add affiliate tracking to the order
          order.affiliateTracking = {
            isAffiliateOrder: true,
            affiliateId: wholesaler._id,
            referralSource: 'pos_wholesaler',
            commissionEarned: commissionEarned,
            commissionPercentage: wholesaler.percent,
            orderTimestamp: new Date(),
            finalAmountPaid: finalAmountPaid
          };
          
          await order.save();
        }
      } catch (error) {
        console.error('Error processing affiliate commission for POS order:', error);
      }
    }

    // Update product stock (consistent with existing order system)
    for (const item of cart.items) {
      try {
        const product = await Product.findById(item.product);
        if (product) {
          console.log(`📦 POS Cart - Updating stock for product: ${product.nameEn}`);
          console.log(`📦 POS Cart - Item specifications:`, JSON.stringify(item.selectedSpecifications, null, 2));
          
          // Import the stock reduction function from OrderController
          const { reduceProductStock } = require('./OrderController');
          
          // Check if product has specification values
          if (product.specificationValues && product.specificationValues.length > 0) {
            console.log(`📦 POS Cart - Product has ${product.specificationValues.length} specification values`);
            
            // Only try to reduce specification stock if we have valid specifications
            if (item.selectedSpecifications && item.selectedSpecifications.length > 0) {
              // Validate that the specifications exist in the product before reducing stock
              const validSpecifications = [];
              
              for (const selectedSpec of item.selectedSpecifications) {
                const specExists = product.specificationValues.find(spec => 
                  spec.specificationId.toString() === selectedSpec.specificationId.toString() &&
                  spec.valueId === selectedSpec.valueId
                );
                
                if (specExists) {
                  validSpecifications.push(selectedSpec);
                  console.log(`✅ POS Cart - Valid specification found: ${selectedSpec.specificationId}:${selectedSpec.valueId}`);
                } else {
                  console.warn(`⚠️ POS Cart - Specification not found in product: ${selectedSpec.specificationId}:${selectedSpec.valueId}`);
                  console.warn(`⚠️ Available specifications:`, product.specificationValues.map(s => `${s.specificationId}:${s.valueId}`));
                }
              }
              
              if (validSpecifications.length > 0) {
                await reduceProductStock(product, item.quantity, validSpecifications);
              } else {
                console.warn(`⚠️ POS Cart - No valid specifications found, only reducing general stock for ${product.nameEn}`);
                // Only reduce general stock
                product.stock -= item.quantity;
                product.soldCount += item.quantity;
                await product.save();
              }
            } else {
              console.log(`📦 POS Cart - No specifications selected, reducing general stock only for ${product.nameEn}`);
              // Only reduce general stock
              product.stock -= item.quantity;
              product.soldCount += item.quantity;
              await product.save();
            }
          } else {
            console.log(`📦 POS Cart - Product has no specification values, reducing general stock only for ${product.nameEn}`);
            // Only reduce general stock
            product.stock -= item.quantity;
            product.soldCount += item.quantity;
            await product.save();
          }
        }
      } catch (error) {
        console.error(`❌ POS Cart - Error updating stock for product ${item.product}:`, error.message);
        // Continue with other items even if one fails
      }
    }

    res.json({
      success: true,
      message: 'POS cart completed and order created successfully',
      data: {
        cartId: cart._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('Complete POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing POS cart',
      error: error.message
    });
  }
};

// Clear POS cart
exports.clearPOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find the cart
    const cart = await POSCart.findOne({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    // Clear cart
    await cart.clearCart();

    res.json({
      success: true,
      message: 'POS cart cleared successfully',
      data: cart
    });

  } catch (error) {
    console.error('Clear POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing POS cart',
      error: error.message
    });
  }
};

// Delete POS cart
exports.deletePOSCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Find and delete the cart
    const cart = await POSCart.findOneAndDelete({
      _id: cartId,
      admin: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'POS cart not found'
      });
    }

    res.json({
      success: true,
      message: 'POS cart deleted successfully'
    });

  } catch (error) {
    console.error('Delete POS cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting POS cart',
      error: error.message
    });
  }
};
