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
        message: 'Guest ID and Store ID are required',
        messageAr: 'معرف الضيف ومعرف المتجر مطلوبان'
      });
    }

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User must be authenticated to merge cart',
        messageAr: 'يجب أن يكون المستخدم مصادقاً لدمج السلة'
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
      message: 'Error merging guest cart',
      messageAr: 'خطأ في دمج سلة الضيف'
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
        message: 'Guest ID and Store ID are required',
        messageAr: 'معرف الضيف ومعرف المتجر مطلوبان'
      });
    }

    const cart = await Cart.findOne({ 
      guestId: guestId, 
      store: storeId 
    }).populate('items.product');

    if (!cart) {
      return res.json({
        success: true,
        message: 'Guest cart retrieved successfully',
        messageAr: 'تم جلب سلة الضيف بنجاح',
        data: { items: [] },
        count: 0
      });
    }

    return res.json({
      success: true,
      message: 'Guest cart retrieved successfully',
      messageAr: 'تم جلب سلة الضيف بنجاح',
      data: cart,
      count: cart.items.length
    });

  } catch (error) {
    console.error('Get cart by guestId error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching guest cart',
      messageAr: 'خطأ في جلب سلة الضيف'
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
    
    // Get ProductSpecification model to fetch proper bilingual values
    const ProductSpecification = require('../Models/ProductSpecification');
    
    // Collect all unique specification IDs
    const specificationIds = new Set();
    cart.items.forEach(item => {
      if (item.selectedSpecifications) {
        item.selectedSpecifications.forEach(spec => {
          if (spec.specificationId) {
            specificationIds.add(spec.specificationId.toString());
          }
        });
      }
    });
    
    // Fetch all specifications at once for efficiency
    const specifications = await ProductSpecification.find({
      _id: { $in: Array.from(specificationIds) }
    });
    
    // Create a map for quick lookup
    const specMap = {};
    specifications.forEach(spec => {
      specMap[spec._id.toString()] = spec;
    });
    
    // Process cart items to add bilingual data and clean Mongoose internal fields
    const processedCart = {
      _id: cart._id,
      user: cart.user,
      guestId: cart.guestId,
      store: cart.store,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map(item => {
        const itemObj = item.toObject ? item.toObject() : item;
        const productObj = item.product?.toObject ? item.product.toObject() : item.product;
        
        return {
          product: productObj,
          quantity: itemObj.quantity || item.quantity,
          priceAtAdd: itemObj.priceAtAdd || item.priceAtAdd,
          variant: itemObj.variant || item.variant,
          addedAt: itemObj.addedAt || item.addedAt,
          // Clean and format selectedSpecifications with proper bilingual values
          selectedSpecifications: (itemObj.selectedSpecifications || item.selectedSpecifications || []).map(spec => {
            const specObj = spec.toObject ? spec.toObject() : spec;
            const cleanSpec = specObj._doc || specObj;
            
            // Get the ProductSpecification to find proper Ar/En values
            const specification = specMap[cleanSpec.specificationId?.toString()];
            let valueAr = cleanSpec.valueAr;
            let valueEn = cleanSpec.valueEn;
            let titleAr = cleanSpec.titleAr;
            let titleEn = cleanSpec.titleEn;
            
            if (specification) {
              titleAr = specification.titleAr;
              titleEn = specification.titleEn;
              
              // Find the value in the specification's values array
              const value = specification.values?.find(v => 
                v.valueAr === cleanSpec.value || 
                v.valueEn === cleanSpec.value ||
                v.valueAr === cleanSpec.valueAr ||
                v.valueEn === cleanSpec.valueEn
              );
              
              if (value) {
                valueAr = value.valueAr;
                valueEn = value.valueEn;
              }
            }
            
            return {
              specificationId: cleanSpec.specificationId,
              valueId: cleanSpec.valueId,
              titleAr: titleAr || cleanSpec.title || '',
              titleEn: titleEn || cleanSpec.title || '',
              valueAr: valueAr || cleanSpec.value || '',
              valueEn: valueEn || cleanSpec.value || ''
            };
          }),
          // Clean selectedColors
          selectedColors: itemObj.selectedColors || item.selectedColors || []
        };
      })
    };
    
    if (cart.items.length !== originalLength) {
      await cart.save();
      
      return res.json({ 
        success: true, 
        data: processedCart,
        message: `Removed ${removedItems.length} unavailable item${removedItems.length !== 1 ? 's' : ''} from cart`,
        messageAr: `تم إزالة ${removedItems.length} منتج${removedItems.length > 2 ? 'ات' : ''} غير متوفر من السلة`,
        removedItemsCount: removedItems.length
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Cart retrieved successfully',
      messageAr: 'تم جلب السلة بنجاح',
      data: processedCart 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching cart',
      messageAr: 'خطأ في جلب السلة',
      error: error.message 
    });
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
      return res.status(400).json({ 
        success: false, 
        message: 'Product and quantity are required',
        messageAr: 'المنتج والكمية مطلوبان'
      });
    }
    
    // Get ProductSpecification model to fetch proper bilingual values
    const ProductSpecification = require('../Models/ProductSpecification');
    
    // Fetch specifications with bilingual values
    let enrichedSpecifications = [];
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      for (const spec of selectedSpecifications) {
        if (!spec.specificationId || !spec.valueId) {
          return res.status(400).json({ 
            success: false, 
            message: 'selectedSpecifications must include specificationId and valueId',
            messageAr: 'يجب أن تتضمن المواصفات المحددة معرف المواصفة ومعرف القيمة'
          });
        }
        
        // Fetch the specification from database to get bilingual values
        const specificationDoc = await ProductSpecification.findById(spec.specificationId);
        if (specificationDoc) {
          // Find the matching value in the specification's values array
          const matchingValue = specificationDoc.values?.find(v => 
            spec.valueId.includes(v.valueAr) || 
            spec.valueId.includes(v.valueEn) ||
            v.valueAr === spec.value ||
            v.valueEn === spec.value ||
            v.valueAr === spec.valueAr ||
            v.valueEn === spec.valueEn
          );
          
          if (matchingValue) {
            enrichedSpecifications.push({
              specificationId: spec.specificationId,
              valueId: spec.valueId,
              titleAr: specificationDoc.titleAr,
              titleEn: specificationDoc.titleEn,
              valueAr: matchingValue.valueAr,
              valueEn: matchingValue.valueEn
            });
          } else {
            // Fallback if no matching value found
            enrichedSpecifications.push({
              specificationId: spec.specificationId,
              valueId: spec.valueId,
              titleAr: spec.titleAr || specificationDoc.titleAr || '',
              titleEn: spec.titleEn || specificationDoc.titleEn || '',
              valueAr: spec.valueAr || spec.value || '',
              valueEn: spec.valueEn || spec.value || ''
            });
          }
        } else {
          // If specification not found, use what was provided
          enrichedSpecifications.push({
            specificationId: spec.specificationId,
            valueId: spec.valueId,
            titleAr: spec.titleAr || spec.title || '',
            titleEn: spec.titleEn || spec.title || '',
            valueAr: spec.valueAr || spec.value || '',
            valueEn: spec.valueEn || spec.value || ''
          });
        }
      }
    }
    
    const prod = await Product.findOne({ _id: product, store: req.store._id });
    if (!prod) return res.status(404).json({ 
      success: false, 
      message: 'Product not found in this store',
      messageAr: 'المنتج غير موجود في هذا المتجر'
    });
    
    // التحقق من أن المنتج نشط
    if (!prod.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product is not available',
        messageAr: 'المنتج غير متوفر'
      });
    }
    
    // التحقق من توفر المخزون بناءً على الـ specifications المختارة
    const availableStock = getAvailableStock(prod, enrichedSpecifications);
    
    // التحقق من وجود جميع الـ specifications المختارة
    if (enrichedSpecifications && enrichedSpecifications.length > 0) {
      for (const selectedSpec of enrichedSpecifications) {
        // Try multiple validation approaches
        let specValue = prod.specificationValues.find(spec => 
          spec.specificationId.toString() === selectedSpec.specificationId &&
          spec.valueId === selectedSpec.valueId
        );
        
        // If not found, try case-insensitive comparison
        if (!specValue) {
          specValue = prod.specificationValues.find(spec => 
            spec.specificationId.toString().toLowerCase() === selectedSpec.specificationId.toLowerCase() &&
            spec.valueId.toLowerCase() === selectedSpec.valueId.toLowerCase()
          );
        }
        
        // If still not found, try matching by specification ID and value
        if (!specValue && selectedSpec.value) {
          specValue = prod.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId &&
            spec.value === selectedSpec.value
          );
        }
        
        // Final fallback: if valueId looks malformed, use first available specification
        if (!specValue && selectedSpec.valueId && selectedSpec.valueId.startsWith(selectedSpec.specificationId)) {
          const availableValues = prod.specificationValues.filter(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId
          );
          if (availableValues.length > 0) {
            specValue = availableValues[0];
            console.log(`⚠️ Cart - Using fallback specification: ${specValue.valueId} (${specValue.value})`);
          }
        }
        
        if (!specValue) {
          return res.status(400).json({ 
            success: false, 
            message: `Selected specification not found: ${selectedSpec.valueId}`,
            messageAr: `المواصفة المحددة غير موجودة: ${selectedSpec.valueId}`
          });
        }
      }
    }
    
    if (availableStock <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Selected product variant is out of stock',
        messageAr: 'نوع المنتج المحدد غير متوفر في المخزون'
      });
    }
    
    // التحقق من أن الكمية المطلوبة متوفرة
    if (quantity > availableStock) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available in stock for selected specifications`,
        messageAr: `فقط ${availableStock} قطعة متوفرة في المخزون للمواصفات المحددة`
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
      selectedSpecifications: enrichedSpecifications,
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
        message: `Cannot add ${quantity} item${quantity !== 1 ? 's' : ''}. Total quantity (${totalQuantity}) exceeds available stock (${availableStock}) for selected specifications`,
        messageAr: `لا يمكن إضافة ${quantity} قطعة. الكمية الإجمالية (${totalQuantity}) تتجاوز المخزون المتاح (${availableStock}) للمواصفات المحددة`
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
    return res.json({ 
      success: true, 
      message: 'Product added to cart successfully',
      messageAr: 'تمت إضافة المنتج إلى السلة بنجاح',
      data: cart 
    });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error adding product to cart',
      messageAr: 'خطأ في إضافة المنتج إلى السلة',
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
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be 0 or greater',
        messageAr: 'الكمية يجب أن تكون 0 أو أكثر'
      });
    }
    
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ 
      success: false, 
      message: 'Cart not found',
      messageAr: 'السلة غير موجودة'
    });
    
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ 
      success: false, 
      message: 'Product not in cart',
      messageAr: 'المنتج غير موجود في السلة'
    });
    
    // التحقق من المخزون إذا كانت الكمية أكبر من صفر
    if (quantity > 0) {
      const product = await Product.findOne({ _id: productId, store: req.store._id });
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found',
          messageAr: 'المنتج غير موجود'
        });
      }
      
      // التحقق من أن المنتج نشط
      if (!product.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product is not available',
          messageAr: 'المنتج غير متوفر'
        });
      }
      
      // التحقق من توفر المخزون بناءً على الـ specifications المختارة
      const availableStock = getAvailableStock(product, selectedSpecifications);
      
      // التحقق من وجود جميع الـ specifications المختارة
      if (selectedSpecifications && selectedSpecifications.length > 0) {
        for (const selectedSpec of selectedSpecifications) {
          // Try multiple validation approaches
          let specValue = product.specificationValues.find(spec => 
            spec.specificationId.toString() === selectedSpec.specificationId &&
            spec.valueId === selectedSpec.valueId
          );
          
          // If not found, try case-insensitive comparison
          if (!specValue) {
            specValue = product.specificationValues.find(spec => 
              spec.specificationId.toString().toLowerCase() === selectedSpec.specificationId.toLowerCase() &&
              spec.valueId.toLowerCase() === selectedSpec.valueId.toLowerCase()
            );
          }
          
          // If still not found, try matching by specification ID and value
          if (!specValue && selectedSpec.value) {
            specValue = product.specificationValues.find(spec => 
              spec.specificationId.toString() === selectedSpec.specificationId &&
              spec.value === selectedSpec.value
            );
          }
          
          // Final fallback: if valueId looks malformed, use first available specification
          if (!specValue && selectedSpec.valueId && selectedSpec.valueId.startsWith(selectedSpec.specificationId)) {
            const availableValues = product.specificationValues.filter(spec => 
              spec.specificationId.toString() === selectedSpec.specificationId
            );
            if (availableValues.length > 0) {
              specValue = availableValues[0];
              console.log(`⚠️ Cart Update - Using fallback specification: ${specValue.valueId} (${specValue.value})`);
            }
          }
          
          if (!specValue) {
            return res.status(400).json({ 
              success: false, 
              message: `Selected specification not found: ${selectedSpec.valueId}`,
              messageAr: `المواصفة المحددة غير موجودة: ${selectedSpec.valueId}`
            });
          }
        }
      }
      
      if (availableStock <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected product variant is out of stock',
          messageAr: 'نوع المنتج المحدد غير متوفر في المخزون'
        });
      }
      
      if (quantity > availableStock) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available in stock for selected specifications`,
          messageAr: `فقط ${availableStock} قطعة متوفرة في المخزون للمواصفات المحددة`
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
    return res.json({ 
      success: true, 
      message: 'Cart item updated successfully',
      messageAr: 'تم تحديث عنصر السلة بنجاح',
      data: cart 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating cart item',
      messageAr: 'خطأ في تحديث عنصر السلة',
      error: error.message 
    });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ 
      success: false, 
      message: 'Cart not found',
      messageAr: 'السلة غير موجودة'
    });
    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ 
      success: false, 
      message: 'Product not in cart',
      messageAr: 'المنتج غير موجود في السلة'
    });
    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate('items.product');
    return res.json({ 
      success: true, 
      message: 'Product removed from cart successfully',
      messageAr: 'تمت إزالة المنتج من السلة بنجاح',
      data: cart 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error removing product from cart',
      messageAr: 'خطأ في إزالة المنتج من السلة',
      error: error.message 
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const query = getCartQuery(req);
    let cart = await Cart.findOne(query);
    if (!cart) return res.status(404).json({ 
      success: false, 
      message: 'Cart not found',
      messageAr: 'السلة غير موجودة'
    });
    cart.items = [];
    await cart.save();
    await cart.populate('items.product');
    return res.json({ 
      success: true, 
      message: 'Cart cleared successfully',
      messageAr: 'تم تفريغ السلة بنجاح',
      data: cart 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error clearing cart',
      messageAr: 'خطأ في تفريغ السلة',
      error: error.message 
    });
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

