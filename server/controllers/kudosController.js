const crypto = require('crypto');
const db = require('../db/database');

/**
 * Fetch kudos feed
 * Public users only see is_visible = 1 AND deleted_at IS NULL
 * Admins can pass include_hidden=true to see hidden items in moderation view
 */
function getKudos(req, res) {
  try {
    const { category, search, include_hidden, limit = 50, offset = 0 } = req.query;
    const isAdmin = req.user && req.user.role === 'ADMIN';

    let queryConditions = ['k.deleted_at IS NULL'];
    const params = [];

    // Filter by visibility unless admin explicitly requested hidden or is viewing admin mode
    if (!isAdmin || include_hidden !== 'true') {
      queryConditions.push('k.is_visible = 1');
    }

    if (category && category !== 'All') {
      queryConditions.push('k.category = ?');
      params.push(category);
    }

    if (search && search.trim().length > 0) {
      queryConditions.push('(s.name LIKE ? OR r.name LIKE ? OR k.message LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        k.id,
        k.sender_id,
        k.recipient_id,
        k.message,
        k.category,
        k.is_visible,
        k.moderated_by,
        k.moderated_at,
        k.reason_for_moderation,
        k.created_at,
        s.name AS sender_name,
        s.title AS sender_title,
        s.department AS sender_department,
        s.avatar_url AS sender_avatar,
        r.name AS recipient_name,
        r.title AS recipient_title,
        r.department AS recipient_department,
        r.avatar_url AS recipient_avatar,
        m.name AS moderator_name
      FROM kudos k
      JOIN users s ON k.sender_id = s.id
      JOIN users r ON k.recipient_id = r.id
      LEFT JOIN users m ON k.moderated_by = m.id
      ${whereClause}
      ORDER BY k.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    const kudosRows = db.prepare(sql).all(...params);

    // Fetch reactions for each kudos
    const kudosIds = kudosRows.map(k => k.id);
    let reactionsByKudos = {};

    if (kudosIds.length > 0) {
      const placeholders = kudosIds.map(() => '?').join(',');
      const reactions = db.prepare(`
        SELECT kudos_id, emoji, user_id
        FROM reactions
        WHERE kudos_id IN (${placeholders})
      `).all(...kudosIds);

      reactions.forEach(r => {
        if (!reactionsByKudos[r.kudos_id]) {
          reactionsByKudos[r.kudos_id] = {};
        }
        if (!reactionsByKudos[r.kudos_id][r.emoji]) {
          reactionsByKudos[r.kudos_id][r.emoji] = {
            count: 0,
            hasReacted: false
          };
        }
        reactionsByKudos[r.kudos_id][r.emoji].count += 1;
        if (req.user && r.user_id === req.user.id) {
          reactionsByKudos[r.kudos_id][r.emoji].hasReacted = true;
        }
      });
    }

    const enrichedKudos = kudosRows.map(k => ({
      ...k,
      is_visible: Boolean(k.is_visible),
      reactions: reactionsByKudos[k.id] || {}
    }));

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM kudos k
      JOIN users s ON k.sender_id = s.id
      JOIN users r ON k.recipient_id = r.id
      ${whereClause}
    `;
    const countParams = params.slice(0, params.length - 2);
    const total = db.prepare(countSql).get(...countParams).total;

    res.json({
      items: enrichedKudos,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error fetching kudos feed:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Submit a new kudos
 */
function createKudos(req, res) {
  try {
    const { recipient_id, category, sanitizedMessage } = req.body;
    const sender_id = req.user.id;
    const id = `kud_${crypto.randomUUID().slice(0, 8)}`;
    const created_at = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO kudos (
        id, sender_id, recipient_id, message, category, is_visible, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, 1, ?
      )
    `);

    insertStmt.run(id, sender_id, recipient_id, sanitizedMessage, category, created_at);

    // Fetch the newly created record with sender and recipient details
    const newKudos = db.prepare(`
      SELECT 
        k.id, k.sender_id, k.recipient_id, k.message, k.category, k.is_visible, k.created_at,
        s.name AS sender_name, s.title AS sender_title, s.department AS sender_department, s.avatar_url AS sender_avatar,
        r.name AS recipient_name, r.title AS recipient_title, r.department AS recipient_department, r.avatar_url AS recipient_avatar
      FROM kudos k
      JOIN users s ON k.sender_id = s.id
      JOIN users r ON k.recipient_id = r.id
      WHERE k.id = ?
    `).get(id);

    res.status(201).json({
      message: 'Kudos successfully created and broadcast to the portal!',
      kudos: {
        ...newKudos,
        is_visible: true,
        reactions: {}
      }
    });
  } catch (error) {
    console.error('Error creating kudos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

/**
 * Toggle emoji reaction on kudos
 */
function toggleReaction(req, res) {
  try {
    const kudosId = req.params.id;
    const userId = req.user.id;
    const { emoji } = req.body;

    const validEmojis = ['👍', '❤️', '👏', '🚀'];
    if (!emoji || !validEmojis.includes(emoji)) {
      return res.status(400).json({
        error: 'Invalid Emoji',
        message: `Emoji must be one of: ${validEmojis.join(' ')}`
      });
    }

    const kudos = db.prepare('SELECT id FROM kudos WHERE id = ? AND deleted_at IS NULL').get(kudosId);
    if (!kudos) {
      return res.status(404).json({ error: 'Not Found', message: 'Kudos not found.' });
    }

    const existing = db.prepare('SELECT id FROM reactions WHERE kudos_id = ? AND user_id = ? AND emoji = ?').get(kudosId, userId, emoji);

    if (existing) {
      db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
    } else {
      const reactionId = `rx_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare('INSERT INTO reactions (id, kudos_id, user_id, emoji) VALUES (?, ?, ?, ?)').run(reactionId, kudosId, userId, emoji);
    }

    // Return updated reaction counts for this kudos
    const reactions = db.prepare(`
      SELECT emoji, user_id FROM reactions WHERE kudos_id = ?
    `).all(kudosId);

    const reactionSummary = {};
    reactions.forEach(r => {
      if (!reactionSummary[r.emoji]) {
        reactionSummary[r.emoji] = { count: 0, hasReacted: false };
      }
      reactionSummary[r.emoji].count += 1;
      if (r.user_id === userId) {
        reactionSummary[r.emoji].hasReacted = true;
      }
    });

    res.json({
      kudosId,
      reactions: reactionSummary
    });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}

module.exports = {
  getKudos,
  createKudos,
  toggleReaction
};
