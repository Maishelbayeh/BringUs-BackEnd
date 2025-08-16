const mongoose = require('mongoose');
const Store = require('../Models/Store');
require('dotenv').config();

// تاريخ الحذف - المتاجر التي تم إنشاؤها قبل هذا التاريخ سيتم حذفها
const DELETE_BEFORE_DATE = new Date("2025-07-19T00:00:00Z");

async function checkStoresBeforeDelete() {
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
        }).select('_id nameEn nameAr createdAt status subscription.isSubscribed subscription.endDate');

        console.log(`📊 تم العثور على ${storesToDelete.length} متجر للحذف`);
        console.log(`🗓️  تاريخ الحذف: ${DELETE_BEFORE_DATE.toISOString()}`);

        if (storesToDelete.length === 0) {
            console.log('✅ لا توجد متاجر للحذف');
            return;
        }

        // إحصائيات المتاجر
        const activeStores = storesToDelete.filter(store => store.status === 'active');
        const inactiveStores = storesToDelete.filter(store => store.status === 'inactive');
        const subscribedStores = storesToDelete.filter(store => store.subscription?.isSubscribed);
        const trialStores = storesToDelete.filter(store => !store.subscription?.isSubscribed);

        console.log('\n📈 إحصائيات المتاجر التي سيتم حذفها:');
        console.log(`   • إجمالي المتاجر: ${storesToDelete.length}`);
        console.log(`   • متاجر نشطة: ${activeStores.length}`);
        console.log(`   • متاجر غير نشطة: ${inactiveStores.length}`);
        console.log(`   • متاجر مشتركة: ${subscribedStores.length}`);
        console.log(`   • متاجر في الفترة التجريبية: ${trialStores.length}`);

        // عرض المتاجر النشطة والمشتركة (الأكثر أهمية)
        const importantStores = storesToDelete.filter(store => 
            store.status === 'active' || store.subscription?.isSubscribed
        );

        if (importantStores.length > 0) {
            console.log('\n⚠️  المتاجر المهمة التي سيتم حذفها (نشطة أو مشتركة):');
            importantStores.forEach((store, index) => {
                const subscriptionInfo = store.subscription?.isSubscribed 
                    ? `مشترك (ينتهي: ${store.subscription.endDate?.toISOString()})`
                    : 'فترة تجريبية';
                console.log(`${index + 1}. ${store.nameEn || store.nameAr} (${store._id})`);
                console.log(`   الحالة: ${store.status} | الاشتراك: ${subscriptionInfo}`);
                console.log(`   تاريخ الإنشاء: ${store.createdAt.toISOString()}`);
                console.log('');
            });
        }

        // عرض جميع المتاجر (محدود)
        console.log('\n📋 جميع المتاجر التي سيتم حذفها:');
        storesToDelete.slice(0, 20).forEach((store, index) => {
            const subscriptionInfo = store.subscription?.isSubscribed 
                ? `مشترك` 
                : 'فترة تجريبية';
            console.log(`${index + 1}. ${store.nameEn || store.nameAr} (${store._id}) - ${store.status} - ${subscriptionInfo} - ${store.createdAt.toISOString()}`);
        });

        if (storesToDelete.length > 20) {
            console.log(`... و ${storesToDelete.length - 20} متجر آخر`);
        }

        // إحصائيات إضافية
        const totalStores = await Store.countDocuments();
        const storesAfterDelete = totalStores - storesToDelete.length;
        
        console.log('\n📊 إحصائيات إضافية:');
        console.log(`   • إجمالي المتاجر الحالية: ${totalStores}`);
        console.log(`   • المتاجر التي سيتم حذفها: ${storesToDelete.length}`);
        console.log(`   • المتاجر المتبقية بعد الحذف: ${storesAfterDelete}`);

        // تحذير للمتاجر المهمة
        if (importantStores.length > 0) {
            console.log('\n🚨 تحذير:');
            console.log(`   • سيتم حذف ${importantStores.length} متجر نشط أو مشترك`);
            console.log('   • تأكد من أن هذه المتاجر لا تحتوي على بيانات مهمة');
            console.log('   • قد ترغب في عمل نسخة احتياطية قبل الحذف');
        }

    } catch (error) {
        console.error('❌ خطأ في عملية التحقق:', error);
    } finally {
        // إغلاق الاتصال
        await mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
}

// تشغيل السكريبت
if (require.main === module) {
    checkStoresBeforeDelete()
        .then(() => {
            console.log('✅ تم الانتهاء من عملية التحقق');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ فشلت عملية التحقق:', error);
            process.exit(1);
        });
}

module.exports = checkStoresBeforeDelete;

