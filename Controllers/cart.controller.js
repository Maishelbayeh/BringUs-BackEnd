// monjed update start
// Unified Cart Controller for Authenticated & Guest Users
const Cart = require('../Models/Cart');
const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

function getCartQuery(req) {
  console.log('getCartQuery - req.user:', req.user);
  console.log('getCartQuery - req.store:', req.store);
  console.log('getCartQuery - req.guestId:', req.guestId);
  
  if (req.user) return { user: req.user._id, store: req.store._id };
  if (req.guestId) return { guestId: req.guestId, store: req.store._id };
  throw new Error('No user or guestId found');
}

// دالة للتحقق من تطابق العناصر في السلة
function isSameCartItem(item1, item2) {
  // التحقق من المنتج والمتغير
  if (item1.product.toString() !== item2.product.toString() || item1.variant !== item2.variant) {
    return false;
  }
  
  // التحقق من الصفات المختارة
  if (item1.selectedSpecifications && item2.selectedSpecifications) {
    if (item1.selectedSpecifications.length !== item2.selectedSpecifications.length) {
      return false;
    }
    
    for (let i = 0; i < item1.selectedSpecifications.length; i++) {
      const spec1 = item1.selectedSpecifications[i];
      const spec2 = item2.selectedSpecifications[i];
      
      if (spec1.specificationId.toString() !== spec2.specificationId.toString() ||
          spec1.valueId !== spec2.valueId) {
        return false;
      }
    }
  } else if (item1.selectedSpecifications || item2.selectedSpecifications) {
    return false;
  }
  
  // التحقق من الألوان المختارة
  if (item1.selectedColors && item2.selectedColors) {
    if (item1.selectedColors.length !== item2.selectedColors.length) {
      return false;
    }
    
    for (let i = 0; i < item1.selectedColors.length; i++) {
      if (item1.selectedColors[i] !== item2.selectedColors[i]) {
        return false;
      }
    }
  } else if (item1.selectedColors || item2.selectedColors) {
    return false;
  }
  
  return true;
}

// دالة مساعدة لحساب المخزون المتاح بناءً على الـ specifications المختارة
function getAvailableStock(product, selectedSpecifications = []) {
  let availableStock = product.stock;
  
  if (selectedSpecifications && selectedSpecifications.length > 0) {
    for (const selectedSpec of selectedSpecifications) {
      const specValue = product.specificationValues.find(spec => 
        spec.specificationId.toString() === selectedSpec.specificationId &&
        spec.valueId === selectedSpec.valueId
      );
      
      if (specValue && specValue.quantity < availableStock) {
        availableStock = specValue.quantity;
      }
    }
  }
  
  return availableStock;
}

// دالة جديدة لدمج guest cart مع user cart عند تسجيل الدخول
exports.mergeGuestCartToUser = async (req, res) => {
  try {
    const { guestId, storeId } = req.body;
    
    if (!guestId || !storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest ID and Store ID are required' 
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User must be authenticated to merge cart' 
      });
    }

    // البحث عن cart للـ guest
    const guestCart = await Cart.findOne({ 
      guestId: guestId, 
      store: storeId 
    }).populate('items.product');

    if (!guestCart || guestCart.items.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No guest cart items found to merge',
        mergedCount: 0
      });
    }

    // البحث عن cart للمستخدم
    let userCart = await Cart.findOne({ 
      user: req.user._id, 
      store: storeId 
    });

    if (!userCart) {
      userCart = await Cart.create({ 
        user: req.user._id, 
        store: storeId, 
        items: [] 
      });
    }

    let mergedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // دمج كل عنصر من guest cart
    for (const guestItem of guestCart.items) {
      // البحث عن عنصر مطابق في user cart
      const existingItemIndex = userCart.items.findIndex(item => 
        isSameCartItem(item, guestItem)
      );

      if (existingItemIndex > -1) {
        // إذا وجد عنصر مطابق، دمج الكميات
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
        updatedCount++;
      } else {
        // إذا لم يوجد عنصر مطابق، إضافة العنصر
        userCart.items.push(guestItem);
        mergedCount++;
      }
    }

    // حفظ user cart المحدث
    await userCart.save();
    await userCart.populate('items.product');

    // حذف guest cart بعد الدمج الناجح
    await Cart.findByIdAndDelete(guestCart._id);

    return res.json({
      success: true,
      message: `Successfully merged ${mergedCount} items, updated ${updatedCount} items, skipped ${skippedCount} duplicates`,
      mergedCount,
      updatedCount,
      skippedCount,
      totalProcessed: guestCart.items.length,
      data: userCart
    });

  } catch (error) {
    console.error('Merge guest cart error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error merging guest cart' 
    });
  }
};

// دالة للحصول على cart بواسطة guestId (لأغراض الهجرة)
exports.getCartByGuestId = async (req, res) => {
  try {
    const { guestId, storeId } = req.params;
    
    if (!guestId || !storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Guest ID and Store ID are required' 
      });
    }

    const cart = await Cart.findOne({ 
      guestId: guestId, 
      store: storeId 
    }).populate('items.product');

    if (!cart) {
      return res.json({
        success: true,
        data: { items: [] },
        count: 0
      });
    }

    return res.json({
      success: true,
      data: cart,
      count: cart.items.length
    });

  } catch (error) {
    console.error('Get cart by guestId error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching guest cart' 
    });
  }
};

// Remove out-of-stock products from cart when loading
exports.getCart = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query).populate('items.product');
    if (!cart) cart = await Cart.create({ ...query, items: [] });
    
    // Remove items where product is out of stock or inactive
    const originalLength = cart.items.length;
    const removedItems = cart.items.filter(item => {
      if (!item.product || !item.product.isActive) return true;
      
      const availableStock = getAvailableStock(item.product, item.selectedSpecifications);
      return availableStock <= 0;
    });
    
    cart.items = cart.items.filter(item => {
      if (!item.product || !item.product.isActive) return false;
      
      const availableStock = getAvailableStock(item.product, item.selectedSpecifications);
      return availableStock > 0;
    });
    
    if (cart.items.length !== originalLength) {
      await cart.save();
      await cart.populate('items.product');
      
      return res.json({ 
        success: true, 
        data: cart,
        message: `Removed ${removedItems.length} unavailable items from cart`,
        removedItemsCount: removedItems.length
      });
    }
    
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.addToCart = async (req, res) => {
  try {
    console.log('addToCart - req.body:', req.body);
    console.log('addToCart - req.user:', req.user);
    console.log('addToCart - req.store:', req.store);
    
    const { 
      product, 
      quantity, 
      variant,
      selectedSpecifications = [],
      selectedColors = []
    } = req.body;
    
    if (!product || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Product and quantity are required' });
    }
    
    // التحقق من صحة selectedSpecifications
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      for (const spec of selectedSpecifications) {
        if (!spec.specificationId || !spec.valueId) {
          return res.status(400).json({ 
            success: false, 
            message: 'selectedSpecifications must include specificationId and valueId' 
          });
        }
      }
    }
    
    const prod = await Product.findOne({ _id: product, store: req.store._id });
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found in this store' });
    
    // التحقق من أن المنتج نشط
    if (!prod.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product is not available' 
      });
    }
    
    // التحقق من توفر المخزون بناءً على الـ specifications المختارة
    const availableStock = getAvailableStock(prod, selectedSpecifications);
    
    // التحقق من وجود جميع الـ specifications المختارة
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      for (const selectedSpec of selectedSpecifications) {
        const specValue = prod.specificationValues.find(spec => 
          spec.specificationId.toString() === selectedSpec.specificationId &&
          spec.valueId === selectedSpec.valueId
        );
        
        if (!specValue) {
          return res.status(400).json({ 
            success: false, 
            message: `Selected specification not found: ${selectedSpec.valueId}` 
          });
        }
      }
    }
    
    if (availableStock <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Selected product variant is out of stock' 
      });
    }
    
    // التحقق من أن الكمية المطلوبة متوفرة
    if (quantity > availableStock) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${availableStock} items available in stock for selected specifications` 
      });
    }
    
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) cart = await Cart.create({ ...query, items: [] });
    
    // إنشاء العنصر الجديد
    const newItem = {
      product,
      quantity,
      variant,
      priceAtAdd: prod.isOnSale && prod.salePercentage > 0 ? 
        prod.price - (prod.price * prod.salePercentage / 100) : prod.price,
      selectedSpecifications,
      selectedColors
    };
    
    // البحث عن عنصر مطابق في السلة
    const itemIndex = cart.items.findIndex(item => isSameCartItem(item, newItem));
    
    let totalQuantity = quantity;
    if (itemIndex > -1) {
      // إذا وجد عنصر مطابق، حساب الكمية الإجمالية
      totalQuantity += cart.items[itemIndex].quantity;
    }
    
    // التحقق من أن الكمية الإجمالية لا تتجاوز المخزون المتاح
    if (totalQuantity > availableStock) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot add ${quantity} items. Total quantity (${totalQuantity}) exceeds available stock (${availableStock}) for selected specifications` 
      });
    }
    
    if (itemIndex > -1) {
      // إذا وجد عنصر مطابق، زيادة الكمية
      cart.items[itemIndex].quantity += quantity;
    } else {
      // إذا لم يوجد عنصر مطابق، إضافة عنصر جديد
      cart.items.push(newItem);
    }
    
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Something went wrong!',
      error: error.message 
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      quantity, 
      variant,
      selectedSpecifications,
      selectedColors
    } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be 0 or greater' });
    }
    
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });
    
    // التحقق من المخزون إذا كانت الكمية أكبر من صفر
    if (quantity > 0) {
      const product = await Product.findOne({ _id: productId, store: req.store._id });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      
      // التحقق من أن المنتج نشط
      if (!product.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product is not available' 
        });
      }
      
      // التحقق من توفر المخزون بناءً على الـ specifications المختارة
      const availableStock = getAvailableStock(product, selectedSpecifications);
      
      // التحقق من وجود جميع الـ specifications المختارة
      if (selectedSpecifications && selectedSpecifications.length > 0) {
        for (const selectedSpec of selectedSpecifications) {
          const specValue = product.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId &&
            spec.valueId === selectedSpec.valueId
          );
          
          if (!specValue) {
            return res.status(400).json({ 
              success: false, 
              message: `Selected specification not found: ${selectedSpec.valueId}` 
            });
          }
        }
      }
      
      if (availableStock <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected product variant is out of stock' 
        });
      }
      
      if (quantity > availableStock) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${availableStock} items available in stock for selected specifications` 
        });
      }
    }
    
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      if (variant !== undefined) cart.items[itemIndex].variant = variant;
      if (selectedSpecifications !== undefined) cart.items[itemIndex].selectedSpecifications = selectedSpecifications;
      if (selectedColors !== undefined) cart.items[itemIndex].selectedColors = selectedColors;
    }
    
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });
    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items = [];
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate cart totals with proper discount handling
exports.getCartTotals = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query).populate('items.product');
    if (!cart) cart = await Cart.create({ ...query, items: [] });
    
    // Remove items where product is out of stock or inactive
    const originalLength = cart.items.length;
    const removedItems = cart.items.filter(item => {
      if (!item.product || !item.product.isActive) return true;
      
      const availableStock = getAvailableStock(item.product, item.selectedSpecifications);
      return availableStock <= 0;
    });
    
    cart.items = cart.items.filter(item => {
      if (!item.product || !item.product.isActive) return false;
      
      const availableStock = getAvailableStock(item.product, item.selectedSpecifications);
      return availableStock > 0;
    });
    
    if (cart.items.length !== originalLength) {
      await cart.save();
      await cart.populate('items.product');
    }
    
    let subtotal = 0;
    let totalDiscount = 0;
    const itemsWithPrices = [];
    
    for (const item of cart.items) {
      const product = item.product;
      if (!product) continue;
      
      // Calculate the current price (considering any new discounts)
      const currentPrice = product.isOnSale && product.salePercentage > 0 ? 
        product.price - (product.price * product.salePercentage / 100) : product.price;
      
      const itemTotal = currentPrice * item.quantity;
      const originalItemTotal = product.price * item.quantity;
      const itemDiscount = originalItemTotal - itemTotal;
      
      subtotal += itemTotal;
      totalDiscount += itemDiscount;
      
      itemsWithPrices.push({
        productId: product._id,
        name: product.nameEn || product.nameAr,
        quantity: item.quantity,
        originalPrice: product.price,
        currentPrice: currentPrice,
        itemTotal: itemTotal,
        itemDiscount: itemDiscount,
        isOnSale: product.isOnSale,
        salePercentage: product.salePercentage
      });
    }
    
    // Calculate tax and other fees
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    const response = {
      success: true,
      data: {
        items: itemsWithPrices,
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        tax: tax,
        total: total,
        itemCount: cart.items.length
      }
    };
    
    // إضافة رسالة إذا تم إزالة منتجات غير متوفرة
    if (removedItems.length > 0) {
      response.message = `Removed ${removedItems.length} unavailable items from cart`;
      response.removedItemsCount = removedItems.length;
    }
    
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// monjed update end

