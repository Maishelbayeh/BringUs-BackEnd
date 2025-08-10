// monjed update start
// Middleware to extract or generate guestId via request headers
// Supports both authenticated and guest users with persistent storage

// دالة بسيطة لتوليد UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = function guestCart(req, res, next) {
  // إذا كان المستخدم مسجل دخول، لا نحتاج guestId
  if (req.user) {
    return next();
  }
  
  // للمستخدمين غير المسجلين، نحتاج guestId
  // نبحث عن guestId في عدة أماكن بالترتيب:
  // 1. من headers (X-Guest-ID)
  // 2. من query parameters (guestId)
  // 3. من body (guestId)
  // 4. من cookies (guestId)
  let guestId = req.headers['x-guest-id'] || 
                req.query.guestId || 
                req.body.guestId ||
                (req.cookies && req.cookies.guestId);
  
  if (!guestId) {
    // إذا لم نجد guestId، ننشئ واحد جديد
    guestId = generateUUID();
    
    // إضافة الـ guestId إلى الـ response headers ليتمكن العميل من حفظه
    res.setHeader('X-Guest-ID', guestId);
    
    // إضافة cookie أيضاً للاحتفاظ بالـ guestId
    res.cookie('guestId', guestId, {
      httpOnly: false, // للسماح للـ JavaScript بالوصول إليه
      secure: process.env.NODE_ENV === 'production', // HTTPS فقط في الإنتاج
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000 // سنة واحدة
    });
    
    console.log('🆕 Generated new guestId:', guestId);
  } else {
    console.log('🔄 Using existing guestId:', guestId);
    
    // تحديث cookie للتأكد من استمراريتها
    res.cookie('guestId', guestId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000
    });
  }
  
  req.guestId = guestId;
  next();
};
// monjed update end 