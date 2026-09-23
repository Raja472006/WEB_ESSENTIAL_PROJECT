const db = require('../config/database');

// GET /api/goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query('SELECT * FROM nutrition_goals WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      // Create default if missing
      await db.query(
        `INSERT INTO nutrition_goals (user_id, calorie_goal, protein_goal, carbohydrate_goal, fat_goal, water_goal)
         VALUES (?, 2000, 100, 250, 70, 8)`,
        [userId]
      );
      const [newRows] = await db.query('SELECT * FROM nutrition_goals WHERE user_id = ?', [userId]);
      return res.json({ success: true, goals: newRows[0] });
    }

    return res.json({ success: true, goals: rows[0] });
  } catch (err) {
    console.error('getGoals error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve nutrition goals.' });
  }
};

// PUT /api/goals
exports.updateGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { calorie_goal, protein_goal, carbohydrate_goal, fat_goal, water_goal } = req.body;

    const cal = parseFloat(calorie_goal) || 2000;
    const prot = parseFloat(protein_goal) || 100;
    const carb = parseFloat(carbohydrate_goal) || 250;
    const fat = parseFloat(fat_goal) || 70;
    const water = parseInt(water_goal, 10) || 8;

    const [rows] = await db.query('SELECT id FROM nutrition_goals WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO nutrition_goals (user_id, calorie_goal, protein_goal, carbohydrate_goal, fat_goal, water_goal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, cal, prot, carb, fat, water]
      );
    } else {
      await db.query(
        `UPDATE nutrition_goals
         SET calorie_goal = ?, protein_goal = ?, carbohydrate_goal = ?, fat_goal = ?, water_goal = ?
         WHERE user_id = ?`,
        [cal, prot, carb, fat, water, userId]
      );
    }

    return res.json({
      success: true,
      message: 'Nutrition goals updated successfully!',
      goals: {
        calorie_goal: cal,
        protein_goal: prot,
        carbohydrate_goal: carb,
        fat_goal: fat,
        water_goal: water
      }
    });
  } catch (err) {
    console.error('updateGoals error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update nutrition goals.' });
  }
};
