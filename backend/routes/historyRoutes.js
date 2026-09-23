const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/history', historyController.getHistory);

module.exports = router;
