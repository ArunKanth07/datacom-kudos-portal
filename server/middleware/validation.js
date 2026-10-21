const db = require('../db/database');

const VALID_CATEGORIES = ['Teamwork', 'Innovation', 'Customer First', 'Excellence', 'Integrity'];

/**
 * Basic HTML/script tag sanitizer to prevent Stored XSS
 */
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validation Middleware for creating Kudos
 */
function validateKudosCreation(req, res, next) {
  const senderId = req.user.id;
  let { recipient_id, message, category } = req.body;

  // 1. Recipient existence check
  if (!recipient_id || typeof recipient_id !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'recipient_id is required and must be a valid user ID.'
    });
  }

  // 2. Prevent self-kudos
  if (recipient_id === senderId) {
    return res.status(400).json({
      error: 'Self-Kudos Prohibited',
      message: 'You cannot give kudos to yourself. Please select a colleague to appreciate.'
    });
  }

  const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
  if (!recipient) {
    return res.status(404).json({
      error: 'Recipient Not Found',
      message: 'The selected colleague does not exist in the Datacom directory.'
    });
  }

  // 3. Category validation
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid Category',
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`
    });
  }

  // 4. Message content & length validation
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A message of appreciation is required.'
    });
  }

  const cleanedMessage = sanitizeInput(message);
  if (cleanedMessage.length < 5) {
    return res.status(422).json({
      error: 'Validation Error',
      message: 'Kudos message must be at least 5 characters long.'
    });
  }

  if (cleanedMessage.length > 500) {
    return res.status(422).json({
      error: 'Validation Error',
      message: 'Kudos message exceeds the maximum allowed length of 500 characters.'
    });
  }

  // 5. Anti-Spam: Duplicate submission check (within last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const duplicate = db.prepare(`
    SELECT id FROM kudos
    WHERE sender_id = ?
      AND recipient_id = ?
      AND message = ?
      AND created_at >= ?
  `).get(senderId, recipient_id, cleanedMessage, fiveMinutesAgo);

  if (duplicate) {
    return res.status(429).json({
      error: 'Duplicate Submission',
      message: 'An identical kudos was already submitted recently. Please wait a few moments before posting again.'
    });
  }

  // 6. Rate Limiting: Max 10 kudos per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentCount = db.prepare(`
    SELECT COUNT(*) as count FROM kudos
    WHERE sender_id = ?
      AND created_at >= ?
  `).get(senderId, oneHourAgo).count;

  if (recentCount >= 10) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Hourly kudos limit reached (10 kudos / hour). Please take a break!'
    });
  }

  // Attach sanitized message
  req.body.sanitizedMessage = cleanedMessage;
  next();
}

/**
 * Validation Middleware for Moderation Actions
 */
function validateModerationAction(req, res, next) {
  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A detailed moderation reason of at least 5 characters is mandatory for audit compliance.'
    });
  }
  req.body.sanitizedReason = sanitizeInput(reason);
  next();
}

module.exports = {
  validateKudosCreation,
  validateModerationAction,
  sanitizeInput,
  VALID_CATEGORIES
};
