const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/', usersController.getUsers);
router.get('/current', usersController.getCurrentUser);

module.exports = router;
