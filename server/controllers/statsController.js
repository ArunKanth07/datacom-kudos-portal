const db = require('../db/database');

/**
 * Get aggregate metrics for the portal dashboard
 */
function getStats(req, res) {
  try {
    const totalKudos = db.prepare(`
      SELECT COUNT(*) as count FROM kudos WHERE is_visible = 1 AND deleted_at IS NULL
    `).get().count;

    const totalRecognizedColleagues = db.prepare(`
      SELECT COUNT(DISTINCT recipient_id) as count FROM kudos WHERE is_visible = 1 AND deleted_at IS NULL
    `).get().count;

    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM kudos
      WHERE is_visible = 1 AND deleted_at IS NULL
      GROUP BY category
    `).all();

    const totalReactions = db.prepare(`
      SELECT COUNT(*) as count FROM reactions
    `).get().count;

    res.json({
      totalKudos,
      totalRecognizedColleagues,
      totalReactions,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

module.exports = {
  getStats
};
