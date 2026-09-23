const express = require('express');
const router = express.Router();
const waterController = require('../controllers/waterController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/water/today', waterController.getTodayWater);
router.post('/water', waterController.updateWater);
router.put('/water', waterController.updateWater);

module.exports = router;
