/**
 * ملف اختبار لنظام تجديد الاشتراكات التلقائي
 * يمكن تشغيله يدوياً لاختبار النظام
 */

const SubscriptionRenewalService = require('../services/SubscriptionRenewalService');

async function testSubscriptionRenewal() {
  console.log('🧪 بدء اختبار نظام تجديد الاشتراكات...\n');

  try {
    // اختبار 1: فحص الاشتراكات المنتهية
    console.log('📋 اختبار 1: فحص الاشتراكات المنتهية');
    const expiredResult = await SubscriptionRenewalService.checkExpiredSubscriptions();
    console.log('✅ النتيجة:', expiredResult);
    console.log('');

    // اختبار 2: فحص التجديد التلقائي
    console.log('📋 اختبار 2: فحص التجديد التلقائي');
    const renewalResult = await SubscriptionRenewalService.checkAutoRenewals();
    console.log('✅ النتيجة:', renewalResult);
    console.log('');

    // اختبار 3: فحص شامل
    console.log('📋 اختبار 3: فحص شامل');
    const comprehensiveResult = await SubscriptionRenewalService.runSubscriptionCheck();
    console.log('✅ النتيجة:', comprehensiveResult);
    console.log('');

    // اختبار 4: اختبار API Lahza (مع بيانات وهمية)
    console.log('📋 اختبار 4: اختبار API Lahza');
         const testChargeResult = await SubscriptionRenewalService.chargeAuthorization(
       100, // 100 شيكل
       'test@example.com',
       'test_auth_code_123',
       'ILS'
     );
    console.log('✅ النتيجة:', testChargeResult);
    console.log('');

    console.log('🎉 تم الانتهاء من جميع الاختبارات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  testSubscriptionRenewal();
}

module.exports = { testSubscriptionRenewal };
