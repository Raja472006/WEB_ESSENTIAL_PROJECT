const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');

// Public or semi-public food catalog
router.get('/foods', foodController.getFoods);

// Protected food logs routes
router.post('/food-logs', authMiddleware, foodController.createFoodLog);
router.get('/food-logs/today', authMiddleware, foodController.getTodayLogs);
router.get('/food-logs', authMiddleware, foodController.getAllLogs);
router.put('/food-logs/:id', authMiddleware, foodController.updateFoodLog);
router.delete('/food-logs/:id', authMiddleware, foodController.deleteFoodLog);

module.exports = router;
