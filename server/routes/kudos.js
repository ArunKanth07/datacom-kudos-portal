const express = require('express');
const router = express.Router();
const kudosController = require('../controllers/kudosController');
const { validateKudosCreation } = require('../middleware/validation');

router.get('/', kudosController.getKudos);
router.post('/', validateKudosCreation, kudosController.createKudos);
router.post('/:id/react', kudosController.toggleReaction);

module.exports = router;
