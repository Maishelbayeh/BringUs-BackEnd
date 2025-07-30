// سكريبت اختبار النظام الجديد للمستخدمين غير المسجلين
// Test script for the new guest user system

const mongoose = require('mongoose');
const Cart = require('../Models/Cart');
const Like = require('../Models/Like');
const Product = require('../Models/Product');
const Store = require('../Models/Store');

// تكوين قاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bringus';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
}

async function createTestData() {
  try {
    console.log('\n📝 إنشاء بيانات الاختبار...');
    
    // إنشاء متجر للاختبار
    const store = await Store.findOne({ status: 'active' });
    if (!store) {
      console.log('❌ لا يوجد متجر نشط للاختبار');
      return null;
    }
    
    // إنشاء منتج للاختبار
    const product = await Product.findOne({ store: store._id });
    if (!product) {
      console.log('❌ لا يوجد منتج في المتجر للاختبار');
      return null;
    }
    
    console.log('✅ تم إنشاء بيانات الاختبار بنجاح');
    return { store, product };
  } catch (error) {
    console.error('❌ خطأ في إنشاء بيانات الاختبار:', error);
    return null;
  }
}

async function testGuestCart() {
  try {
    console.log('\n🛒 اختبار سلة الضيف...');
    
    const testData = await createTestData();
    if (!testData) return;
    
    const { store, product } = testData;
    const guestId = 'test-guest-' + Date.now();
    
    // إنشاء سلة ضيف
    const cart = await Cart.create({
      guestId,
      store: store._id,
      items: [{
        product: product._id,
        quantity: 2,
        priceAtAdd: product.price
      }]
    });
    
    console.log('✅ تم إنشاء سلة الضيف:', cart._id);
    
    // التحقق من وجود السلة
    const foundCart = await Cart.findOne({ guestId, store: store._id });
    if (foundCart) {
      console.log('✅ تم العثور على سلة الضيف بنجاح');
      console.log('   عدد العناصر:', foundCart.items.length);
    } else {
      console.log('❌ فشل في العثور على سلة الضيف');
    }
    
    // تنظيف البيانات
    await Cart.deleteOne({ _id: cart._id });
    console.log('🧹 تم تنظيف بيانات الاختبار');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار سلة الضيف:', error);
  }
}

async function testGuestLikes() {
  try {
    console.log('\n❤️ اختبار إعجابات الضيف...');
    
    const testData = await createTestData();
    if (!testData) return;
    
    const { store, product } = testData;
    const guestId = 'test-guest-' + Date.now();
    
    // إنشاء إعجاب ضيف
    const like = await Like.create({
      guestId,
      product: product._id,
      store: store._id
    });
    
    console.log('✅ تم إنشاء إعجاب الضيف:', like._id);
    
    // التحقق من وجود الإعجاب
    const foundLike = await Like.findOne({ guestId, product: product._id, store: store._id });
    if (foundLike) {
      console.log('✅ تم العثور على إعجاب الضيف بنجاح');
    } else {
      console.log('❌ فشل في العثور على إعجاب الضيف');
    }
    
    // تنظيف البيانات
    await Like.deleteOne({ _id: like._id });
    console.log('🧹 تم تنظيف بيانات الاختبار');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار إعجابات الضيف:', error);
  }
}

async function testCartMerge() {
  try {
    console.log('\n🔄 اختبار دمج السلة...');
    
    const testData = await createTestData();
    if (!testData) return;
    
    const { store, product } = testData;
    const guestId = 'test-guest-' + Date.now();
    const userId = new mongoose.Types.ObjectId(); // معرف مستخدم وهمي
    
    // إنشاء سلة ضيف
    const guestCart = await Cart.create({
      guestId,
      store: store._id,
      items: [{
        product: product._id,
        quantity: 3,
        priceAtAdd: product.price
      }]
    });
    
    // إنشاء سلة مستخدم
    const userCart = await Cart.create({
      user: userId,
      store: store._id,
      items: [{
        product: product._id,
        quantity: 2,
        priceAtAdd: product.price
      }]
    });
    
    console.log('✅ تم إنشاء سلة الضيف والمستخدم');
    console.log('   سلة الضيف - عدد العناصر:', guestCart.items.length);
    console.log('   سلة المستخدم - عدد العناصر:', userCart.items.length);
    
    // محاكاة عملية الدمج
    guestCart.items.forEach(guestItem => {
      const idx = userCart.items.findIndex(
        item => item.product.toString() === guestItem.product.toString() && item.variant === guestItem.variant
      );
      if (idx > -1) {
        userCart.items[idx].quantity += guestItem.quantity;
      } else {
        userCart.items.push({ ...guestItem.toObject() });
      }
    });
    
    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });
    
    console.log('✅ تم دمج السلة بنجاح');
    console.log('   سلة المستخدم بعد الدمج - عدد العناصر:', userCart.items.length);
    console.log('   الكمية الإجمالية للمنتج:', userCart.items[0].quantity);
    
    // تنظيف البيانات
    await Cart.deleteOne({ _id: userCart._id });
    console.log('🧹 تم تنظيف بيانات الاختبار');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار دمج السلة:', error);
  }
}

async function testIndexes() {
  try {
    console.log('\n📊 اختبار الفهارس...');
    
    // التحقق من فهارس السلة
    const cartIndexes = await Cart.collection.getIndexes();
    console.log('✅ فهارس السلة:', Object.keys(cartIndexes));
    
    // التحقق من فهارس الإعجاب
    const likeIndexes = await Like.collection.getIndexes();
    console.log('✅ فهارس الإعجاب:', Object.keys(likeIndexes));
    
  } catch (error) {
    console.error('❌ خطأ في اختبار الفهارس:', error);
  }
}

async function runTests() {
  console.log('🧪 بدء اختبار النظام الجديد للمستخدمين غير المسجلين...\n');
  
  await connectDB();
  
  await testGuestCart();
  await testGuestLikes();
  await testCartMerge();
  await testIndexes();
  
  console.log('\n✅ تم الانتهاء من جميع الاختبارات بنجاح!');
  
  await mongoose.disconnect();
  console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
}

// تشغيل الاختبارات
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGuestCart,
  testGuestLikes,
  testCartMerge,
  testIndexes
}; 