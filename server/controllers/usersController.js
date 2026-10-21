const db = require('../db/database');

/**
 * Get all colleagues for the directory & dropdown selector
 */
function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, title, department, avatar_url, created_at
      FROM users
      ORDER BY name ASC
    `).all();

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Get currently authenticated user profile
 */
function getCurrentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No authenticated user found.' });
  }
  res.json({ user: req.user });
}

module.exports = {
  getUsers,
  getCurrentUser
};
