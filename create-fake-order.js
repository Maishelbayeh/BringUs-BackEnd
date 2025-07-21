const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }); // عدل اسم قاعدة البيانات إذا لزم الأمر

  const Order = require('./Models/Order');
  const Product = require('./Models/Product');
  const User = require('./Models/User');
  const Store = require('./Models/Store');
  const Affiliation = require('./Models/Affiliation');
  const DeliveryMethod = require('./Models/DeliveryMethod');

  // IDs supplied by the user
  const storeId = '687505893fbf3098648bfe16';
  const userId = '6878f38d4fd8d9aaa4502943';
  const productId = '68760d175c0a31a7ac0965dc';
  const affiliateId = '687609e7513b2b331fa81d62';
  const deliveryId = '687de8494ccd1c25c80947b7';

  const store = await Store.findById(storeId);
  const user = await User.findById(userId);
  const product = await Product.findById(productId);
  const affiliate = await Affiliation.findById(affiliateId);
  const delivery = await DeliveryMethod.findById(deliveryId);

  if (!store || !user || !product || !affiliate || !delivery) {
    console.error('One or more documents not found!');
    process.exit(1);
  }

  // إعداد snapshot لكل كيان
  const storeSnapshot = {
    id: store._id,
    nameAr: store.nameAr,
    nameEn: store.nameEn,
    phone: store.contact?.phone,
    slug: store.slug
  };
  const userSnapshot = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone
  };
  const affiliateData = {
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    mobile: affiliate.mobile,
    address: affiliate.address,
    percent: affiliate.percent,
    status: affiliate.status,
    affiliateCode: affiliate.affiliateCode,
    affiliateLink: affiliate.affiliateLink,
    totalSales: affiliate.totalSales,
    totalCommission: affiliate.totalCommission,
    totalPaid: affiliate.totalPaid,
    balance: affiliate.balance,
    totalOrders: affiliate.totalOrders,
    totalCustomers: affiliate.totalCustomers,
    conversionRate: affiliate.conversionRate,
    lastActivity: affiliate.lastActivity,
    registrationDate: affiliate.registrationDate,
    bankInfo: affiliate.bankInfo,
    settings: affiliate.settings,
    notes: affiliate.notes,
    isVerified: affiliate.isVerified,
    verificationDate: affiliate.verificationDate,
    verifiedBy: affiliate.verifiedBy
  };
  const deliveryAreaData = {
    locationAr: delivery.locationAr,
    locationEn: delivery.locationEn,
    price: delivery.price,
    estimatedDays: delivery.estimatedDays
  };

  // إعداد بيانات المنتج
  const quantity = 2;
  const itemTotal = product.price * quantity;
  const processedItems = [{
    productId: product._id.toString(),
    productSnapshot: {
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      images: product.images,
      price: product.price,
      unit: product.unit,
      color: product.color,
      sku: product.sku || ''
    },
    name: product.nameEn,
    sku: product.sku || '',
    quantity,
    price: product.price,
    totalPrice: itemTotal,
    variant: {}
  }];

  // حساب التوتال كوست
  const subtotal = itemTotal;
  const tax = subtotal * 0.1;
  const deliveryCost = delivery.price;
  const discount = 0;
  const total = subtotal + tax + deliveryCost - discount;

  // توليد رقم الطلب
  const orderNumber = `ORD-${Date.now()}`;

  // إنشاء الطلب
  const order = await Order.create({
    orderNumber, // إضافة رقم الطلب
    store: storeSnapshot,
    user: userSnapshot,
    items: processedItems,
    affiliate: affiliateData,
    deliveryArea: deliveryAreaData,
    currency: 'USD',
    status: 'pending',
    notes: { customer: 'عميل تجريبي', admin: 'طلب تجريبي' },
    isGift: false,
    pricing: {
      subtotal,
      tax,
      shipping: deliveryCost,
      discount,
      total
    }
  });

  // إنقاص مخزون المنتج
  if (product.stock < quantity) {
    console.error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    await mongoose.disconnect();
    process.exit(1);
  }
  product.stock -= quantity;
  await product.save();

  console.log('Order created:', order ? order : 'No order created');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); }); 