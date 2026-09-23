const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/goals', goalController.getGoals);
router.put('/goals', goalController.updateGoals);

module.exports = router;
