// monjed update start
// Middleware to extract or generate guestId via request headers
// Supports both authenticated and guest users

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
  let guestId = req.headers['x-guest-id'] || req.query.guestId || req.body.guestId;
  
  if (!guestId) {
    guestId = generateUUID();
    // إضافة الـ guestId إلى الـ response headers ليتمكن العميل من حفظه
    res.setHeader('X-Guest-ID', guestId);
  }
  
  req.guestId = guestId;
  next();
};
// monjed update end 