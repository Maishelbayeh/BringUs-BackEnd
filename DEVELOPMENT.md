# 🚀 دليل التطوير - BringUs Backend

## إعادة التشغيل التلقائي

تم إعداد النظام لإعادة التشغيل التلقائي عند حدوث تغييرات في الملفات.

### الطرق المتاحة:

#### 1. باستخدام Nodemon (مُوصى به للتطوير)

```bash
# تشغيل عادي مع إعادة تشغيل تلقائي
npm run dev

# تشغيل مع مراقبة شاملة
npm run dev:watch

# تشغيل مع debug mode
npm run dev:debug

# تشغيل مع verbose logging
npm run dev:verbose
```

#### 2. باستخدام PM2 (مُوصى به للإنتاج)

```bash
# تثبيت PM2 (إذا لم يكن مثبتاً)
npm install -g pm2

# تشغيل التطبيق
npm run pm2:start

# إيقاف التطبيق
npm run pm2:stop

# إعادة تشغيل التطبيق
npm run pm2:restart

# إعادة تحميل التطبيق (zero-downtime)
npm run pm2:reload

# عرض السجلات
npm run pm2:logs

# مراقبة التطبيق
npm run pm2:monit

# عرض حالة التطبيق
npm run pm2:status

# حذف التطبيق من PM2
npm run pm2:delete
```

### الملفات التي يتم مراقبتها:

- `server.js`
- `Routes/` - جميع ملفات المسارات
- `Controllers/` - جميع ملفات المتحكمات
- `Models/` - جميع ملفات النماذج
- `middleware/` - جميع ملفات الوسائط
- `services/` - جميع ملفات الخدمات
- `utils/` - جميع ملفات الأدوات المساعدة
- `validators/` - جميع ملفات التحقق

### الملفات المُتجاهلة:

- `node_modules/`
- `logs/`
- `*.log`
- `test/`, `tests/`
- `*.test.js`, `*.spec.js`
- `examples/`
- `scripts/`

### إعدادات Nodemon:

تم إنشاء ملف `nodemon.json` مع الإعدادات التالية:

- **delay**: 1000ms (تأخير قبل إعادة التشغيل)
- **verbose**: true (عرض تفاصيل إعادة التشغيل)
- **colours**: true (ألوان في Terminal)
- **restartable**: "rs" (إمكانية إعادة التشغيل اليدوي)
- **pollingInterval**: 1000ms (فترة فحص التغييرات)

### إعدادات PM2:

تم إنشاء ملف `ecosystem.config.js` مع الإعدادات التالية:

- **autorestart**: true (إعادة تشغيل تلقائي)
- **max_memory_restart**: 1G (إعادة تشغيل عند تجاوز 1GB)
- **restart_delay**: 1000ms (تأخير إعادة التشغيل)
- **max_restarts**: 10 (أقصى عدد إعادة تشغيل)
- **min_uptime**: 10s (الحد الأدنى للوقت قبل إعادة التشغيل)

### أوامر مفيدة:

```bash
# إعادة تشغيل يدوي (في nodemon)
rs

# إيقاف nodemon
Ctrl + C

# عرض سجلات PM2
pm2 logs

# مراقبة جميع التطبيقات
pm2 monit

# حفظ قائمة التطبيقات
pm2 save

# استعادة التطبيقات المحفوظة
pm2 resurrect
```

### استكشاف الأخطاء:

إذا لم تعمل إعادة التشغيل التلقائي:

1. تأكد من تثبيت `nodemon`:
   ```bash
   npm install nodemon --save-dev
   ```

2. تأكد من تثبيت `pm2` (إذا كنت تستخدمه):
   ```bash
   npm install -g pm2
   ```

3. تحقق من ملف `nodemon.json` و `ecosystem.config.js`

4. تأكد من أن الملفات ليست في قائمة `ignore_watch`

### ملاحظات:

- يستخدم `nodemon` للتطوير المحلي
- يستخدم `PM2` للإنتاج والمراقبة
- يتم حفظ السجلات في مجلد `logs/`
- يمكن تخصيص الإعدادات في `nodemon.json` و `ecosystem.config.js`
