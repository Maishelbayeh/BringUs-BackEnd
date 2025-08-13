/**
 * ملف اختبار API Lahza مع البيانات الحقيقية
 * يمكن تشغيله لاختبار الاتصال بـ API Lahza
 */

const SubscriptionRenewalService = require('../services/SubscriptionRenewalService');

async function testLahzaAPI() {
  console.log('🧪 بدء اختبار API Lahza...\n');

  try {
    // اختبار 1: اختبار API مع بيانات وهمية
    console.log('📋 اختبار 1: اختبار API مع بيانات وهمية');
    const testResult1 = await SubscriptionRenewalService.chargeAuthorization(
      100, // 100 شيكل
      'test@example.com',
      'test_auth_code_123',
      'ILS'
    );
    console.log('✅ النتيجة:', JSON.stringify(testResult1, null, 2));
    console.log('');

    // اختبار 2: اختبار API مع مبلغ مختلف
    console.log('📋 اختبار 2: اختبار API مع مبلغ 50 شيكل');
    const testResult2 = await SubscriptionRenewalService.chargeAuthorization(
      50, // 50 شيكل
      'test@example.com',
      'test_auth_code_456',
      'ILS'
    );
    console.log('✅ النتيجة:', JSON.stringify(testResult2, null, 2));
    console.log('');

    // اختبار 3: اختبار تحويل العملات
    console.log('📋 اختبار 3: اختبار تحويل العملات');
    console.log('ILS 100 -> aghora:', SubscriptionRenewalService.convertToSmallestUnit(100, 'ILS'));
    console.log('USD 100 -> cents:', SubscriptionRenewalService.convertToSmallestUnit(100, 'USD'));
    console.log('JOD 100 -> qirsh:', SubscriptionRenewalService.convertToSmallestUnit(100, 'JOD'));
    console.log('');

    // اختبار 4: اختبار مع عملة مختلفة
    console.log('📋 اختبار 4: اختبار مع عملة USD');
    const testResult4 = await SubscriptionRenewalService.chargeAuthorization(
      100, // 100 دولار
      'test@example.com',
      'test_auth_code_usd',
      'USD'
    );
    console.log('✅ النتيجة:', JSON.stringify(testResult4, null, 2));
    console.log('');

    console.log('🎉 تم الانتهاء من جميع اختبارات API Lahza!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  testLahzaAPI();
}

module.exports = { testLahzaAPI };
