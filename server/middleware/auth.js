const db = require('../db/database');

/**
 * Authentication Middleware
 * Resolves current user from `x-user-id` header or defaults to first employee
 * Supports role enforcement (USER, ADMIN)
 */
function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'] || req.query.as_user;

  if (!userId) {
    // Default fallback to first user for seamless demo browsing if header omitted
    const defaultUser = db.prepare("SELECT * FROM users WHERE role = 'USER' ORDER BY name ASC LIMIT 1").get();
    req.user = defaultUser;
    return next();
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: `User with id "${userId}" not found in employee directory.`
    });
  }

  req.user = user;
  next();
}

/**
 * Admin Authorization Guard
 * Enforces role === 'ADMIN' for moderation operations
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to perform this action.'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Administrator privileges are required to moderate content.'
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  requireAdmin
};
