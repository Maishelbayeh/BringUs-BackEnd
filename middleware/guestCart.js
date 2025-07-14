// monjed update start
// Middleware to extract or generate guestId via signed cookie
const { v4: uuidv4 } = require('uuid');

const COOKIE_NAME = 'guestId';
const COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
};

module.exports = function guestCart(req, res, next) {
  if (req.user) return next(); // Authenticated users don't need guestId
  let guestId = req.signedCookies[COOKIE_NAME];
  if (!guestId) {
    guestId = uuidv4();
    res.cookie(COOKIE_NAME, guestId, COOKIE_OPTIONS);
  }
  req.guestId = guestId;
  next();
};
// monjed update end 