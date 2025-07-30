// سكريبت إنشاء بيانات تجريبية لطرق الدفع مع QR code والصور
// Script to create sample payment method data with QR codes and images

const mongoose = require('mongoose');
const PaymentMethod = require('../Models/PaymentMethod');
const Store = require('../Models/Store');

// تكوين قاعدة البيانات
const MONGODB_URI = 'mongodb://localhost:27017/bringus';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    process.exit(1);
  }
}

async function createPaymentMethods() {
  try {
    // البحث عن متجر موجود
    const store = await Store.findOne({ status: 'active' });
    if (!store) {
      console.error('❌ لم يتم العثور على متجر نشط');
      return;
    }

    console.log(`🏪 إنشاء طرق دفع للمتجر: ${store.name}`);

    // حذف طرق الدفع الموجودة للمتجر
    await PaymentMethod.deleteMany({ store: store._id });
    console.log('🗑️ تم حذف طرق الدفع القديمة');

    // 1. طريقة دفع نقدي
    const cashPayment = new PaymentMethod({
      store: store._id,
      titleAr: 'الدفع النقدي',
      titleEn: 'Cash Payment',
      descriptionAr: 'ادفع نقداً عند استلام الطلب',
      descriptionEn: 'Pay cash upon order delivery',
      methodType: 'cash',
      isActive: true,
      isDefault: true,
      processingFee: 0,
      minimumAmount: 0,
      maximumAmount: 10000,
      supportedCurrencies: ['USD', 'JOD'],
      logoUrl: 'https://example.com/cash-logo.png',
      paymentImages: [
        {
          imageUrl: 'https://example.com/cash-icon.png',
          imageType: 'logo',
          altText: 'Cash Payment Icon',
          priority: 1
        }
      ]
    });

    // 2. طريقة دفع ببطاقة الائتمان
    const cardPayment = new PaymentMethod({
      store: store._id,
      titleAr: 'بطاقة الائتمان',
      titleEn: 'Credit Card',
      descriptionAr: 'ادفع ببطاقة الائتمان أو الخصم',
      descriptionEn: 'Pay with credit or debit card',
      methodType: 'card',
      isActive: true,
      isDefault: false,
      processingFee: 2.5,
      minimumAmount: 1,
      maximumAmount: 5000,
      supportedCurrencies: ['USD', 'JOD', 'EUR'],
      logoUrl: 'https://example.com/card-logo.png',
      paymentImages: [
        {
          imageUrl: 'https://example.com/visa-logo.png',
          imageType: 'logo',
          altText: 'Visa Logo',
          priority: 1
        },
        {
          imageUrl: 'https://example.com/mastercard-logo.png',
          imageType: 'logo',
          altText: 'Mastercard Logo',
          priority: 2
        }
      ]
    });

    // 3. طريقة دفع عبر المحفظة الرقمية
    const digitalWalletPayment = new PaymentMethod({
      store: store._id,
      titleAr: 'المحفظة الرقمية',
      titleEn: 'Digital Wallet',
      descriptionAr: 'ادفع عبر المحفظة الرقمية',
      descriptionEn: 'Pay using digital wallet',
      methodType: 'digital_wallet',
      isActive: true,
      isDefault: false,
      processingFee: 1.5,
      minimumAmount: 0.5,
      maximumAmount: 2000,
      supportedCurrencies: ['USD', 'JOD'],
      logoUrl: 'https://example.com/wallet-logo.png',
      paymentImages: [
        {
          imageUrl: 'https://example.com/paypal-logo.png',
          imageType: 'logo',
          altText: 'PayPal Logo',
          priority: 1
        },
        {
          imageUrl: 'https://example.com/apple-pay-logo.png',
          imageType: 'logo',
          altText: 'Apple Pay Logo',
          priority: 2
        }
      ]
    });

    // 4. طريقة دفع عبر التحويل البنكي
    const bankTransferPayment = new PaymentMethod({
      store: store._id,
      titleAr: 'التحويل البنكي',
      titleEn: 'Bank Transfer',
      descriptionAr: 'احول المبلغ إلى الحساب البنكي',
      descriptionEn: 'Transfer amount to bank account',
      methodType: 'bank_transfer',
      isActive: true,
      isDefault: false,
      processingFee: 0,
      minimumAmount: 10,
      maximumAmount: 50000,
      supportedCurrencies: ['USD', 'JOD'],
      logoUrl: 'https://example.com/bank-logo.png',
      paymentImages: [
        {
          imageUrl: 'https://example.com/bank-account-info.png',
          imageType: 'payment_screenshot',
          altText: 'Bank Account Information',
          priority: 1
        }
      ]
    });

    // 5. طريقة دفع عبر QR Code (مثل Reflect)
    const qrCodePayment = new PaymentMethod({
      store: store._id,
      titleAr: 'الدفع عبر QR Code',
      titleEn: 'QR Code Payment',
      descriptionAr: 'امسح رمز QR للدفع السريع',
      descriptionEn: 'Scan QR code for quick payment',
      methodType: 'qr_code',
      isActive: true,
      isDefault: false,
      processingFee: 0,
      minimumAmount: 0.1,
      maximumAmount: 1000,
      supportedCurrencies: ['USD', 'JOD'],
      logoUrl: 'https://example.com/qr-logo.png',
      qrCode: {
        enabled: true,
        qrCodeUrl: 'https://reflect.com/pay/store123',
        qrCodeImage: 'https://example.com/qr-code-image.png',
        qrCodeData: 'https://reflect.com/pay/store123?amount='
      },
      paymentImages: [
        {
          imageUrl: 'https://example.com/reflect-logo.png',
          imageType: 'logo',
          altText: 'Reflect Logo',
          priority: 1
        },
        {
          imageUrl: 'https://example.com/qr-code-example.png',
          imageType: 'qr_code',
          altText: 'QR Code Example',
          priority: 2
        },
        {
          imageUrl: 'https://example.com/payment-screenshot.png',
          imageType: 'payment_screenshot',
          altText: 'Payment Screenshot',
          priority: 3
        }
      ]
    });

    // 6. طريقة دفع أخرى
    const otherPayment = new PaymentMethod({
      store: store._id,
      titleAr: 'طرق دفع أخرى',
      titleEn: 'Other Payment Methods',
      descriptionAr: 'طرق دفع إضافية متاحة',
      descriptionEn: 'Additional payment methods available',
      methodType: 'other',
      isActive: true,
      isDefault: false,
      processingFee: 1,
      minimumAmount: 1,
      maximumAmount: 5000,
      supportedCurrencies: ['USD', 'JOD'],
      logoUrl: 'https://example.com/other-logo.png',
      paymentImages: [
        {
          imageUrl: 'https://example.com/other-payment-logo.png',
          imageType: 'logo',
          altText: 'Other Payment Logo',
          priority: 1
        }
      ]
    });

    // حفظ جميع طرق الدفع
    const paymentMethods = [
      cashPayment,
      cardPayment,
      digitalWalletPayment,
      bankTransferPayment,
      qrCodePayment,
      otherPayment
    ];

    const savedMethods = await PaymentMethod.insertMany(paymentMethods);
    
    console.log(`✅ تم إنشاء ${savedMethods.length} طريقة دفع بنجاح`);
    
    // عرض تفاصيل طرق الدفع المنشأة
    savedMethods.forEach((method, index) => {
      console.log(`\n${index + 1}. ${method.titleEn} (${method.methodType})`);
      console.log(`   - Arabic: ${method.titleAr}`);
      console.log(`   - Active: ${method.isActive}`);
      console.log(`   - Default: ${method.isDefault}`);
      console.log(`   - Processing Fee: ${method.processingFee}%`);
      console.log(`   - QR Code Enabled: ${method.qrCode.enabled}`);
      console.log(`   - Payment Images: ${method.paymentImages.length}`);
    });

    return savedMethods;

  } catch (error) {
    console.error('❌ خطأ في إنشاء طرق الدفع:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await createPaymentMethods();
    console.log('\n🎉 تم إكمال إنشاء بيانات طرق الدفع بنجاح!');
  } catch (error) {
    console.error('💥 خطأ في العملية:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  main();
}

module.exports = {
  createPaymentMethods,
  connectDB
}; 