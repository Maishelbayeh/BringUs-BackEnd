# تحديث بنية المنتجات - Product Structure Update

## 🔄 التغييرات المطبقة

### 1. تغيير Category من واحد إلى Array
```javascript
// القديم
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, 'Product category is required']
}

// الجديد
categories: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, 'Product categories are required']
}],
// الاحتفاظ بـ category للتوافق مع الكود القديم
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, 'Product category is required']
}
```

**المميزات:**
- يمكن للمنتج أن ينتمي لأكثر من فئة
- الاحتفاظ بـ `category` للتوافق مع الكود القديم
- تحديث تلقائي لـ `category` من أول عنصر في `categories`

### 2. إضافة كمية منفصلة لكل Specification
```javascript
// القديم
specificationValues: [{
  specificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSpecification' },
  valueId: { type: String },
  value: { type: String },
  title: { type: String }
}]

// الجديد
specificationValues: [{
  specificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSpecification' },
  valueId: { type: String },
  value: { type: String },
  title: { type: String },
  quantity: { type: Number, required: true, min: 0, default: 0 }, // كمية منفصلة
  price: { type: Number, min: 0, default: 0 } // سعر منفصل (اختياري)
}]
```

**المميزات:**
- كل specification لها كمية منفصلة (مثل: سمول 10 قطع، لارج 5 قطع)
- إمكانية إضافة سعر منفصل لكل specification
- Virtual fields لحساب إجمالي الكميات وحالة المخزون

### 3. تغيير Colors ليقبل JSON دائماً
```javascript
// القديم
colors: [{
  type: [String], // Array of color codes
  validate: { /* validation logic */ }
}]

// الجديد
colors: {
  type: String, // JSON string
  default: '[]',
  validate: {
    validator: function(colors) {
      try {
        const parsedColors = JSON.parse(colors);
        // validation logic for parsed JSON
      } catch (error) {
        return false;
      }
    }
  }
}
```

**المميزات:**
- تخزين الألوان كـ JSON string دائماً
- تحويل تلقائي من Array إلى JSON
- Virtual fields للتعامل مع الألوان المحللة

## 🆕 Virtual Fields الجديدة

### 1. `totalSpecificationQuantities`
```javascript
// يحسب إجمالي الكميات من جميع specifications
productSchema.virtual('totalSpecificationQuantities').get(function() {
  if (!this.specificationValues || !Array.isArray(this.specificationValues)) {
    return 0;
  }
  return this.specificationValues.reduce((total, spec) => total + (spec.quantity || 0), 0);
});
```

### 2. `specificationStockStatus`
```javascript
// يحسب حالة المخزون بناءً على specifications
productSchema.virtual('specificationStockStatus').get(function() {
  if (!this.specificationValues || !Array.isArray(this.specificationValues)) {
    return 'no_specifications';
  }
  
  const totalQuantity = this.specificationValues.reduce((total, spec) => total + (spec.quantity || 0), 0);
  if (totalQuantity === 0) return 'out_of_stock';
  if (totalQuantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});
```

## 🔧 Middleware المضافة

### 1. Pre-save Middleware
```javascript
productSchema.pre('save', function(next) {
  // تحديث category من categories إذا كان categories موجود
  if (this.categories && this.categories.length > 0 && !this.category) {
    this.category = this.categories[0];
  }
  
  // تحويل colors إلى JSON إذا كان array
  if (Array.isArray(this.colors)) {
    this.colors = JSON.stringify(this.colors);
  }
  
  next();
});
```

### 2. Pre-findOneAndUpdate Middleware
```javascript
productSchema.pre('findOneAndUpdate', function(next) {
  // نفس المنطق للـ update operations
  if (this._update.categories && this._update.categories.length > 0 && !this._update.category) {
    this._update.category = this._update.categories[0];
  }
  
  if (this._update.colors && Array.isArray(this._update.colors)) {
    this._update.colors = JSON.stringify(this._update.colors);
  }
  
  next();
});
```

## 📊 Indexes الجديدة

```javascript
// Index للـ categories array
productSchema.index({ categories: 1 });

// Index للـ specification quantities
productSchema.index({ 'specificationValues.quantity': 1 });
```

## 🚀 كيفية تشغيل Migration

### 1. تشغيل Migration Script
```bash
cd BringUs-BackEnd
node scripts/migrate-product-structure.js
```

### 2. ما يفعله Migration
- إضافة `categories` array للمنتجات التي لا تملكها
- إضافة `quantity` و `price` لجميع `specificationValues`
- تحويل `colors` من Array إلى JSON string
- تحديث `availableQuantity` إذا لم تكن موجودة

## 📝 مثال على البيانات الجديدة

### مثال على Product مع Specifications
```javascript
{
  _id: "product123",
  nameAr: "بلوزة",
  nameEn: "Blouse",
  categories: ["category1", "category2"], // array من categories
  category: "category1", // للتوافق مع الكود القديم
  
  specificationValues: [
    {
      specificationId: "size_spec",
      valueId: "size_spec_0",
      value: "سمول",
      title: "الحجم",
      quantity: 10, // كمية منفصلة
      price: 0 // سعر إضافي (اختياري)
    },
    {
      specificationId: "size_spec",
      valueId: "size_spec_1", 
      value: "لارج",
      title: "الحجم",
      quantity: 5, // كمية منفصلة
      price: 5 // سعر إضافي
    }
  ],
  
  colors: '[["#000000"], ["#FFFFFF", "#FF0000"]]', // JSON string
  
  // Virtual fields (محسوبة تلقائياً)
  totalSpecificationQuantities: 15, // 10 + 5
  specificationStockStatus: "in_stock"
}
```

## ⚠️ ملاحظات مهمة

1. **التوافق مع الكود القديم**: تم الاحتفاظ بـ `category` للتوافق مع الكود الموجود
2. **التحويل التلقائي**: يتم تحويل البيانات تلقائياً عند الحفظ
3. **Migration ضروري**: يجب تشغيل migration script لتحديث البيانات الموجودة
4. **Validation**: تم إضافة validation للبيانات الجديدة

## 🔄 التحديثات المطلوبة في Frontend

1. **تحديث Forms**: لإضافة حقول الكمية والسعر لكل specification
2. **تحديث Display**: لعرض الكميات المنفصلة لكل specification
3. **تحديث API Calls**: للتعامل مع البيانات الجديدة
4. **تحديث Validation**: للتحقق من صحة البيانات الجديدة 