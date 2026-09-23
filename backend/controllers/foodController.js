const db = require('../config/database');

// Helper to get formatted today string YYYY-MM-DD
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/foods (Searchable food catalog)
exports.getFoods = async (req, res) => {
  try {
    const search = req.query.q ? `%${req.query.q.trim()}%` : null;
    let sql = 'SELECT * FROM foods ORDER BY food_name ASC';
    let params = [];

    if (search) {
      sql = 'SELECT * FROM foods WHERE food_name LIKE ? ORDER BY food_name ASC';
      params = [search];
    }

    const [foods] = await db.query(sql, params);
    return res.json({ success: true, count: foods.length, foods });
  } catch (err) {
    console.error('getFoods error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch food catalog.' });
  }
};

// POST /api/food-logs (Add food entry)
exports.createFoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { food_name, meal_type, quantity, calories, protein, carbohydrates, fat, food_id, log_date } = req.body;

    if (!food_name || !meal_type || calories === undefined || calories === null) {
      return res.status(400).json({
        success: false,
        message: 'Food name, meal type, and calories are required.'
      });
    }

    const validMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    if (!validMeals.includes(meal_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be Breakfast, Lunch, Dinner, or Snack.'
      });
    }

    const targetDate = log_date || getTodayString();
    const qty = quantity || '1 serving';
    const cal = parseFloat(calories) || 0;
    const prot = parseFloat(protein) || 0;
    const carb = parseFloat(carbohydrates) || 0;
    const f = parseFloat(fat) || 0;
    const fId = food_id ? parseInt(food_id, 10) : null;

    const [result] = await db.query(
      `INSERT INTO food_logs (user_id, food_id, food_name, meal_type, quantity, calories, protein, carbohydrates, fat, log_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fId, food_name.trim(), meal_type, qty, cal, prot, carb, f, targetDate]
    );

    return res.status(201).json({
      success: true,
      message: 'Food added successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('createFoodLog error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add food record.' });
  }
};

// GET /api/food-logs/today (Today's meals + totals)
exports.getTodayLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();

    const [logs] = await db.query(
      `SELECT id, user_id, food_id, food_name, meal_type, quantity, calories, protein, carbohydrates, fat, log_date, created_at
       FROM food_logs
       WHERE user_id = ? AND log_date = ?
       ORDER BY created_at DESC, id DESC`,
      [userId, today]
    );

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    logs.forEach(log => {
      totalCalories += parseFloat(log.calories) || 0;
      totalProtein += parseFloat(log.protein) || 0;
      totalCarbs += parseFloat(log.carbohydrates) || 0;
      totalFat += parseFloat(log.fat) || 0;
    });

    return res.json({
      success: true,
      date: today,
      count: logs.length,
      totals: {
        calories: Math.round(totalCalories * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        carbohydrates: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10
      },
      logs
    });
  } catch (err) {
    console.error('getTodayLogs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve today’s meals.' });
  }
};

// GET /api/food-logs (Filtered or all logs)
exports.getAllLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, meal_type } = req.query;

    let sql = 'SELECT * FROM food_logs WHERE user_id = ?';
    const params = [userId];

    if (date) {
      sql += ' AND log_date = ?';
      params.push(date);
    }
    if (meal_type) {
      sql += ' AND meal_type = ?';
      params.push(meal_type);
    }

    sql += ' ORDER BY log_date DESC, created_at DESC';

    const [logs] = await db.query(sql, params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('getAllLogs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve food logs.' });
  }
};

// PUT /api/food-logs/:id (Update food log)
exports.updateFoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = parseInt(req.params.id, 10);
    const { food_name, meal_type, quantity, calories, protein, carbohydrates, fat, log_date } = req.body;

    // Check ownership
    const [existing] = await db.query('SELECT * FROM food_logs WHERE id = ? AND user_id = ?', [logId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food record not found or you do not have permission to edit it.'
      });
    }

    const current = existing[0];
    const newName = food_name !== undefined ? food_name.trim() : current.food_name;
    const newMeal = meal_type !== undefined ? meal_type : current.meal_type;
    const newQty = quantity !== undefined ? quantity : current.quantity;
    const newCal = calories !== undefined ? parseFloat(calories) : current.calories;
    const newProt = protein !== undefined ? parseFloat(protein) : current.protein;
    const newCarb = carbohydrates !== undefined ? parseFloat(carbohydrates) : current.carbohydrates;
    const newFat = fat !== undefined ? parseFloat(fat) : current.fat;
    const newDate = log_date !== undefined ? log_date : current.log_date;

    await db.query(
      `UPDATE food_logs
       SET food_name = ?, meal_type = ?, quantity = ?, calories = ?, protein = ?, carbohydrates = ?, fat = ?, log_date = ?
       WHERE id = ? AND user_id = ?`,
      [newName, newMeal, newQty, newCal, newProt, newCarb, newFat, newDate, logId, userId]
    );

    return res.json({
      success: true,
      message: 'Food updated successfully'
    });
  } catch (err) {
    console.error('updateFoodLog error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update food record.' });
  }
};

// DELETE /api/food-logs/:id (Delete food log)
exports.deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = parseInt(req.params.id, 10);

    // Verify ownership
    const [existing] = await db.query('SELECT id FROM food_logs WHERE id = ? AND user_id = ?', [logId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food record not found or you do not have permission to delete it.'
      });
    }

    await db.query('DELETE FROM food_logs WHERE id = ? AND user_id = ?', [logId, userId]);

    return res.json({
      success: true,
      message: 'Food deleted successfully'
    });
  } catch (err) {
    console.error('deleteFoodLog error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete food record.' });
  }
};
