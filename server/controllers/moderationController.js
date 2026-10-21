const crypto = require('crypto');
const db = require('../db/database');

/**
 * Hide an inappropriate or policy-violating kudos
 * (Admin Only)
 */
function hideKudos(req, res) {
  try {
    const kudosId = req.params.id;
    const adminId = req.user.id;
    const { sanitizedReason } = req.body;

    const kudos = db.prepare('SELECT * FROM kudos WHERE id = ? AND deleted_at IS NULL').get(kudosId);
    if (!kudos) {
      return res.status(404).json({ error: 'Not Found', message: 'Kudos not found or already deleted.' });
    }

    const now = new Date().toISOString();

    const hideTx = db.transaction(() => {
      // 1. Update kudos table with moderation metadata
      db.prepare(`
        UPDATE kudos
        SET is_visible = 0,
            moderated_by = ?,
            moderated_at = ?,
            reason_for_moderation = ?
        WHERE id = ?
      `).run(adminId, now, sanitizedReason, kudosId);

      // 2. Insert audit log record
      const logId = `mod_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO moderation_logs (id, kudos_id, admin_id, action, reason, created_at)
        VALUES (?, ?, ?, 'HIDE', ?, ?)
      `).run(logId, kudosId, adminId, sanitizedReason, now);
    });

    hideTx();

    res.json({
      message: 'Kudos successfully hidden from public feed.',
      kudosId,
      is_visible: false,
      moderated_by: adminId,
      moderated_at: now,
      reason_for_moderation: sanitizedReason
    });
  } catch (error) {
    console.error('Error hiding kudos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Unhide / restore a previously hidden kudos
 * (Admin Only)
 */
function unhideKudos(req, res) {
  try {
    const kudosId = req.params.id;
    const adminId = req.user.id;
    const { sanitizedReason = 'Restored after administrator review.' } = req.body;

    const kudos = db.prepare('SELECT * FROM kudos WHERE id = ? AND deleted_at IS NULL').get(kudosId);
    if (!kudos) {
      return res.status(404).json({ error: 'Not Found', message: 'Kudos not found or already deleted.' });
    }

    const now = new Date().toISOString();

    const unhideTx = db.transaction(() => {
      db.prepare(`
        UPDATE kudos
        SET is_visible = 1,
            moderated_by = NULL,
            moderated_at = NULL,
            reason_for_moderation = NULL
        WHERE id = ?
      `).run(kudosId);

      const logId = `mod_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO moderation_logs (id, kudos_id, admin_id, action, reason, created_at)
        VALUES (?, ?, ?, 'UNHIDE', ?, ?)
      `).run(logId, kudosId, adminId, sanitizedReason, now);
    });

    unhideTx();

    res.json({
      message: 'Kudos successfully restored to public feed.',
      kudosId,
      is_visible: true
    });
  } catch (error) {
    console.error('Error unhiding kudos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Soft-delete a severe or abusive kudos
 * (Admin Only)
 */
function softDeleteKudos(req, res) {
  try {
    const kudosId = req.params.id;
    const adminId = req.user.id;
    const { sanitizedReason = 'Permanently removed by administrator.' } = req.body;

    const kudos = db.prepare('SELECT * FROM kudos WHERE id = ?').get(kudosId);
    if (!kudos) {
      return res.status(404).json({ error: 'Not Found', message: 'Kudos not found.' });
    }

    const now = new Date().toISOString();

    const deleteTx = db.transaction(() => {
      db.prepare(`
        UPDATE kudos
        SET deleted_at = ?,
            is_visible = 0,
            moderated_by = ?,
            moderated_at = ?,
            reason_for_moderation = ?
        WHERE id = ?
      `).run(now, adminId, now, sanitizedReason, kudosId);

      const logId = `mod_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO moderation_logs (id, kudos_id, admin_id, action, reason, created_at)
        VALUES (?, ?, ?, 'DELETE', ?, ?)
      `).run(logId, kudosId, adminId, sanitizedReason, now);
    });

    deleteTx();

    res.json({
      message: 'Kudos successfully soft-deleted and removed from all feeds.',
      kudosId,
      deleted_at: now
    });
  } catch (error) {
    console.error('Error soft-deleting kudos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Get moderation audit logs for compliance & transparency
 * (Admin Only)
 */
function getModerationLogs(req, res) {
  try {
    const logs = db.prepare(`
      SELECT 
        l.id,
        l.kudos_id,
        l.action,
        l.reason,
        l.created_at,
        u.name AS admin_name,
        u.email AS admin_email,
        k.message AS kudos_snippet,
        s.name AS sender_name,
        r.name AS recipient_name
      FROM moderation_logs l
      JOIN users u ON l.admin_id = u.id
      LEFT JOIN kudos k ON l.kudos_id = k.id
      LEFT JOIN users s ON k.sender_id = s.id
      LEFT JOIN users r ON k.recipient_id = r.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    res.json({ logs });
  } catch (error) {
    console.error('Error retrieving moderation logs:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

module.exports = {
  hideKudos,
  unhideKudos,
  softDeleteKudos,
  getModerationLogs
};
