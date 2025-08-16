const mongoose = require('mongoose');
const Store = require('../Models/Store');
require('dotenv').config();

// تاريخ الحذف - المتاجر التي تم إنشاؤها قبل هذا التاريخ سيتم حذفها
const DELETE_BEFORE_DATE = new Date("2025-07-19T00:00:00Z");

async function deleteStoresBeforeDate() {
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

        // عرض المتاجر التي سيتم حذفها (أول 10 فقط للعرض)
        console.log('\n📋 المتاجر التي سيتم حذفها:');
        storesToDelete.slice(0, 10).forEach((store, index) => {
            console.log(`${index + 1}. ${store.nameEn || store.nameAr} (${store._id}) - ${store.createdAt.toISOString()}`);
        });

        if (storesToDelete.length > 10) {
            console.log(`... و ${storesToDelete.length - 10} متجر آخر`);
        }

        // تأكيد الحذف
        console.log('\n⚠️  تحذير: هذا الإجراء لا يمكن التراجع عنه!');
        console.log(`سيتم حذف ${storesToDelete.length} متجر نهائياً`);
        
        // في البيئة الإنتاجية، يمكنك إضافة تأكيد تفاعلي هنا
        // const readline = require('readline');
        // const rl = readline.createInterface({
        //     input: process.stdin,
        //     output: process.stdout
        // });
        // const answer = await new Promise(resolve => {
        //     rl.question('هل أنت متأكد من الحذف؟ اكتب "نعم" للتأكيد: ', resolve);
        // });
        // rl.close();
        // if (answer !== 'نعم') {
        //     console.log('❌ تم إلغاء العملية');
        //     return;
        // }

        // حذف المتاجر
        console.log('\n🗑️  بدء عملية الحذف...');
        const deleteResult = await Store.deleteMany({
            createdAt: { $lt: DELETE_BEFORE_DATE }
        });

        console.log(`✅ تم حذف ${deleteResult.deletedCount} متجر بنجاح`);

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
    deleteStoresBeforeDate()
        .then(() => {
            console.log('✅ تم الانتهاء من العملية');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ فشلت العملية:', error);
            process.exit(1);
        });
}

module.exports = deleteStoresBeforeDate;

