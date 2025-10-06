# نظام إدارة الاشتراكات - Subscription Management System

## نظرة عامة

تم إنشاء نظام شامل لإدارة اشتراكات المتاجر في منصة BringUs. النظام يتضمن:

1. **فترة تجريبية مجانية**: 14 يوم لكل متجر جديد
2. **خطط اشتراك مرنة**: شهر، 3 أشهر، 6 أشهر، سنة
3. **فحص تلقائي يومي**: كل يوم الساعة 12 ظهراً
4. **إدارة شاملة**: تفعيل، إلغاء، تمديد، مراقبة

## الميزات الرئيسية

### 🔄 فحص تلقائي يومي
- يعمل كل يوم الساعة 12:00 ظهراً
- يفحص جميع المتاجر تلقائياً
- يحول المتاجر المنتهية صلاحيتها إلى `inactive`
- يرسل تنبيهات للمتاجر التي تنتهي صلاحيتها قريباً

### 📊 إحصائيات شاملة
- إجمالي المتاجر النشطة/غير النشطة
- عدد المشتركين مقابل التجريبيين
- المتاجر التي تنتهي صلاحيتها اليوم/هذا الأسبوع

### 🎯 إدارة مرنة
- تفعيل اشتراكات بأي مدة
- تمديد الفترة التجريبية
- إلغاء فوري أو في نهاية الفترة
- مراقبة حالة كل متجر

## هيكل البيانات

### نموذج Store المحدث
```javascript
subscription: {
  isSubscribed: Boolean,        // هل مشترك أم لا
  plan: String,                 // نوع الخطة (free, monthly, quarterly, semi_annual, annual)
  startDate: Date,              // تاريخ بداية الاشتراك
  endDate: Date,                // تاريخ انتهاء الاشتراك
  lastPaymentDate: Date,        // تاريخ آخر دفع
  nextPaymentDate: Date,        // تاريخ الدفع القادم
  trialEndDate: Date,           // تاريخ انتهاء الفترة التجريبية
  autoRenew: Boolean,           // تجديد تلقائي
  paymentMethod: String,        // طريقة الدفع
  amount: Number,               // مبلغ الاشتراك
  currency: String              // العملة
}
```

### Virtual Properties
```javascript
isSubscriptionActive    // هل الاشتراك نشط
isTrialExpired         // هل انتهت الفترة التجريبية
daysUntilTrialExpires  // أيام حتى انتهاء الفترة التجريبية
daysUntilSubscriptionExpires // أيام حتى انتهاء الاشتراك
```

## API Endpoints

### 📈 الإحصائيات
```
GET /api/subscription/stats
```
يحصل على إحصائيات شاملة لجميع الاشتراكات

### 🔍 فحص متجر محدد
```
GET /api/subscription/check/{storeId}
```
يفحص حالة اشتراك متجر محدد

### ⚡ تشغيل فحص يدوي
```
POST /api/subscription/trigger-check
```
تشغيل فحص الاشتراكات يدوياً (للسوبرادمن فقط)

### ✅ تفعيل اشتراك
```
POST /api/subscription/activate/{storeId}
```
تفعيل أو تجديد اشتراك لمتجر

### ⏰ تمديد الفترة التجريبية
```
POST /api/subscription/extend-trial/{storeId}
```
تمديد الفترة التجريبية لمتجر

### 📋 المتاجر المنتهية صلاحيتها قريباً
```
GET /api/subscription/expiring?days=7
```
قائمة المتاجر التي تنتهي صلاحيتها خلال أيام محددة

### 🚫 المتاجر الملغية
```
GET /api/subscription/deactivated?days=30
```
قائمة المتاجر الملغية خلال فترة محددة

### ❌ إلغاء اشتراك
```
POST /api/subscription/cancel/{storeId}
```
إلغاء اشتراك متجر

## أمثلة الاستخدام

### تفعيل اشتراك شهري
```javascript
const response = await fetch('/api/subscription/activate/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    plan: 'monthly',
    durationInDays: 30,
    amount: 99.99,
    paymentMethod: 'credit_card',
    autoRenew: true
  })
});
```

### تمديد الفترة التجريبية
```javascript
const response = await fetch('/api/subscription/extend-trial/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    daysToAdd: 7
  })
});
```

### الحصول على الإحصائيات
```javascript
const response = await fetch('/api/subscription/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const stats = await response.json();
console.log('إجمالي المتاجر:', stats.data.total);
console.log('المشتركين:', stats.data.subscribed);
console.log('التجريبيين:', stats.data.trial);
```

## خطط الاشتراك المتاحة

| الخطة | المدة | الوصف |
|-------|-------|-------|
| `free` | 14 يوم | فترة تجريبية مجانية |
| `monthly` | 30 يوم | اشتراك شهري |
| `quarterly` | 90 يوم | اشتراك ربع سنوي |
| `semi_annual` | 180 يوم | اشتراك نصف سنوي |
| `annual` | 365 يوم | اشتراك سنوي |

## آلية العمل

### 1. إنشاء متجر جديد
- يحصل تلقائياً على فترة تجريبية 30 يوم
- `isSubscribed: false`
- `trialEndDate: createdAt + 30 days`

### 2. الفحص اليومي (12:00 ظهراً)
- يفحص جميع المتاجر
- يتحقق من `trialEndDate` و `endDate`
- يحول المتاجر المنتهية إلى `inactive`
- يرسل تنبيهات للمتاجر التي تنتهي قريباً

### 3. تفعيل اشتراك
- يحدث `isSubscribed: true`
- يحدد `plan`, `startDate`, `endDate`
- يحدث `status: active`

### 4. إلغاء اشتراك
- `immediate: true` - إلغاء فوري
- `immediate: false` - إلغاء في نهاية الفترة

## التنبيهات والإشعارات

النظام يرسل تنبيهات في الحالات التالية:
- **3 أيام قبل انتهاء الفترة التجريبية**
- **3 أيام قبل انتهاء الاشتراك**
- **يوم انتهاء الاشتراك/الفترة التجريبية**
- **بعد إلغاء الاشتراك**

## الأمان والصلاحيات

- جميع endpoints تتطلب مصادقة
- معظم العمليات تتطلب صلاحيات سوبرادمن
- فحص تلقائي لمنع التلاعب بالتواريخ

## المراقبة والتتبع

### سجلات النظام
```
🔄 Starting daily subscription status check...
📊 Found 5 stores to deactivate
🔴 Deactivated store: Electronics Store (507f1f77bcf86cd799439011)
⚠️ Store expiring soon: Fashion Store - 3 days left
📋 Subscription check completed:
   ✅ Total stores checked: 150
   🔴 Stores deactivated: 5
   ⚠️ Warnings generated: 12
   ❌ Errors encountered: 0
```

### مؤشرات الأداء
- عدد المتاجر النشطة
- معدل التحويل من تجريبي إلى مشترك
- معدل الإلغاء
- الإيرادات الشهرية

## التطوير المستقبلي

### ميزات مقترحة
1. **نظام دفع متكامل** - Stripe, PayPal
2. **خطط اشتراك مخصصة** - حسب عدد المنتجات/الطلبات
3. **خصومات وحملات** - كوبونات، عروض خاصة
4. **تقارير متقدمة** - تحليلات مفصلة
5. **إشعارات متعددة** - Email, SMS, Push notifications

### تحسينات تقنية
1. **Queue System** - لمعالجة الفحوصات الكبيرة
2. **Caching** - لتسريع الاستعلامات
3. **Webhooks** - لإشعارات فورية
4. **Audit Logs** - لتتبع جميع التغييرات

## استكشاف الأخطاء

### مشاكل شائعة
1. **المتجر لا يتم إلغاؤه تلقائياً**
   - تحقق من إعدادات الوقت الزمني
   - راجع سجلات Cron job

2. **خطأ في حساب الأيام**
   - تأكد من صحة `trialEndDate` و `endDate`
   - تحقق من Virtual properties

3. **مشاكل في Cron job**
   - تحقق من تشغيل الخادم
   - راجع سجلات النظام

### أوامر تشخيصية
```bash
# فحص حالة cron job
node -e "const cron = require('node-cron'); console.log('Cron available:', !!cron);"

# تشغيل فحص يدوي
curl -X POST http://localhost:5001/api/subscription/trigger-check \
  -H "Authorization: Bearer YOUR_TOKEN"

# فحص إحصائيات
curl http://localhost:5001/api/subscription/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## الدعم والمساعدة

للمساعدة أو الإبلاغ عن مشاكل:
1. راجع سجلات الخادم
2. تحقق من Swagger UI للتوثيق التفاعلي
3. استخدم endpoints التشخيصية
4. راجع ملف README هذا

---

**ملاحظة**: هذا النظام مصمم ليكون مرناً وقابلاً للتوسع. يمكن تخصيصه حسب احتياجات العمل المحددة.
