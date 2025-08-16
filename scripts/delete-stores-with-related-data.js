const mongoose = require('mongoose');
const Store = require('../Models/Store');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const User = require('../Models/User');
const Category = require('../Models/Category');
const StoreSlider = require('../Models/StoreSlider');
const Advertisement = require('../Models/Advertisement');
const SocialComment = require('../Models/SocialComment');
const Like = require('../Models/Like');
const Cart = require('../Models/Cart');
require('dotenv').config();

// تاريخ الحذف - المتاجر التي تم إنشاؤها قبل هذا التاريخ سيتم حذفها
const DELETE_BEFORE_DATE = new Date("2025-07-19T00:00:00Z");

async function deleteStoresWithRelatedData() {
    try {
        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

        // البحث عن المتاجر التي تم إنشاؤها قبل التاريخ المحدد
        const storesToDelete = await Store.find({
            createdAt: { $lt: DELETE_BEFORE_DATE }
        }).select('_id nameEn nameAr createdAt');

        console.log(`📊 تم العثور على ${storesToDelete.length} متجر للحذف`);
        console.log(`🗓️  تاريخ الحذف: ${DELETE_BEFORE_DATE.toISOString()}`);

        if (storesToDelete.length === 0) {
            console.log('✅ لا توجد متاجر للحذف');
            return;
        }

        const storeIds = storesToDelete.map(store => store._id);

        console.log('\n🗑️  بدء عملية حذف البيانات المرتبطة...');

        // حذف البيانات المرتبطة بالمتاجر
        const deleteResults = {};

        // حذف المنتجات
        console.log('📦 حذف المنتجات...');
        const productsResult = await Product.deleteMany({ store: { $in: storeIds } });
        deleteResults.products = productsResult.deletedCount;
        console.log(`   ✅ تم حذف ${productsResult.deletedCount} منتج`);

        // حذف الطلبات
        console.log('📋 حذف الطلبات...');
        const ordersResult = await Order.deleteMany({ store: { $in: storeIds } });
        deleteResults.orders = ordersResult.deletedCount;
        console.log(`   ✅ تم حذف ${ordersResult.deletedCount} طلب`);

        // حذف المستخدمين (الذين ينتمون لهذه المتاجر)
        console.log('👥 حذف المستخدمين...');
        const usersResult = await User.deleteMany({ store: { $in: storeIds } });
        deleteResults.users = usersResult.deletedCount;
        console.log(`   ✅ تم حذف ${usersResult.deletedCount} مستخدم`);

        // حذف الفئات
        console.log('🏷️  حذف الفئات...');
        const categoriesResult = await Category.deleteMany({ store: { $in: storeIds } });
        deleteResults.categories = categoriesResult.deletedCount;
        console.log(`   ✅ تم حذف ${categoriesResult.deletedCount} فئة`);

        // حذف السلايدرز
        console.log('🖼️  حذف السلايدرز...');
        const slidersResult = await StoreSlider.deleteMany({ store: { $in: storeIds } });
        deleteResults.sliders = slidersResult.deletedCount;
        console.log(`   ✅ تم حذف ${slidersResult.deletedCount} سلايدر`);

        // حذف الإعلانات
        console.log('📢 حذف الإعلانات...');
        const adsResult = await Advertisement.deleteMany({ store: { $in: storeIds } });
        deleteResults.advertisements = adsResult.deletedCount;
        console.log(`   ✅ تم حذف ${adsResult.deletedCount} إعلان`);

        // حذف التعليقات الاجتماعية
        console.log('💬 حذف التعليقات الاجتماعية...');
        const commentsResult = await SocialComment.deleteMany({ store: { $in: storeIds } });
        deleteResults.socialComments = commentsResult.deletedCount;
        console.log(`   ✅ تم حذف ${commentsResult.deletedCount} تعليق`);

        // حذف الإعجابات
        console.log('❤️  حذف الإعجابات...');
        const likesResult = await Like.deleteMany({ store: { $in: storeIds } });
        deleteResults.likes = likesResult.deletedCount;
        console.log(`   ✅ تم حذف ${likesResult.deletedCount} إعجاب`);

        // حذف سلات التسوق
        console.log('🛒 حذف سلات التسوق...');
        const cartsResult = await Cart.deleteMany({ store: { $in: storeIds } });
        deleteResults.carts = cartsResult.deletedCount;
        console.log(`   ✅ تم حذف ${cartsResult.deletedCount} سلة تسوق`);

        // حذف المتاجر نفسها
        console.log('🏪 حذف المتاجر...');
        const storesResult = await Store.deleteMany({ _id: { $in: storeIds } });
        deleteResults.stores = storesResult.deletedCount;
        console.log(`   ✅ تم حذف ${storesResult.deletedCount} متجر`);

        // عرض ملخص النتائج
        console.log('\n📊 ملخص عملية الحذف:');
        console.log('='.repeat(50));
        Object.entries(deleteResults).forEach(([key, count]) => {
            console.log(`   • ${key}: ${count}`);
        });

        const totalDeleted = Object.values(deleteResults).reduce((sum, count) => sum + count, 0);
        console.log(`\n🎯 إجمالي العناصر المحذوفة: ${totalDeleted}`);

        // التحقق من النتيجة
        const remainingStores = await Store.countDocuments({
            createdAt: { $lt: DELETE_BEFORE_DATE }
        });

        if (remainingStores === 0) {
            console.log('✅ تم حذف جميع المتاجر المطلوبة بنجاح');
        } else {
            console.log(`⚠️  تبقى ${remainingStores} متجر لم يتم حذفه`);
        }

        // إحصائيات إضافية
        const totalStores = await Store.countDocuments();
        console.log(`📊 إجمالي المتاجر المتبقية: ${totalStores}`);

    } catch (error) {
        console.error('❌ خطأ في عملية الحذف:', error);
    } finally {
        // إغلاق الاتصال
        await mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
}

// تشغيل السكريبت
if (require.main === module) {
    deleteStoresWithRelatedData()
        .then(() => {
            console.log('✅ تم الانتهاء من العملية');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ فشلت العملية:', error);
            process.exit(1);
        });
}

module.exports = deleteStoresWithRelatedData;

