const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { requireAdmin } = require('../middleware/auth');
const { validateModerationAction } = require('../middleware/validation');

// All moderation routes strictly require Admin role
router.use(requireAdmin);

router.post('/:id/hide', validateModerationAction, moderationController.hideKudos);
router.post('/:id/unhide', moderationController.unhideKudos);
router.delete('/:id', moderationController.softDeleteKudos);
router.get('/logs', moderationController.getModerationLogs);

module.exports = router;
