const db = require('../config/database');

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/water/today
exports.getTodayWater = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();

    const [waterRows] = await db.query(
      'SELECT glasses FROM water_logs WHERE user_id = ? AND log_date = ?',
      [userId, today]
    );

    const [goalRows] = await db.query(
      'SELECT water_goal FROM nutrition_goals WHERE user_id = ?',
      [userId]
    );

    const glasses = waterRows.length > 0 ? waterRows[0].glasses : 0;
    const goal = goalRows.length > 0 ? goalRows[0].water_goal : 8;

    return res.json({
      success: true,
      date: today,
      glasses,
      goal
    });
  } catch (err) {
    console.error('getTodayWater error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve water intake.' });
  }
};

// POST or PUT /api/water
exports.updateWater = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();
    let { glasses, action } = req.body;

    const [waterRows] = await db.query(
      'SELECT id, glasses FROM water_logs WHERE user_id = ? AND log_date = ?',
      [userId, today]
    );

    let currentGlasses = waterRows.length > 0 ? waterRows[0].glasses : 0;

    if (action === 'add') {
      currentGlasses += 1;
    } else if (action === 'remove') {
      currentGlasses = Math.max(0, currentGlasses - 1);
    } else if (glasses !== undefined) {
      currentGlasses = Math.max(0, parseInt(glasses, 10) || 0);
    }

    if (waterRows.length === 0) {
      await db.query(
        'INSERT INTO water_logs (user_id, glasses, log_date) VALUES (?, ?, ?)',
        [userId, currentGlasses, today]
      );
    } else {
      await db.query(
        'UPDATE water_logs SET glasses = ? WHERE user_id = ? AND log_date = ?',
        [currentGlasses, userId, today]
      );
    }

    const [goalRows] = await db.query(
      'SELECT water_goal FROM nutrition_goals WHERE user_id = ?',
      [userId]
    );
    const goal = goalRows.length > 0 ? goalRows[0].water_goal : 8;

    return res.json({
      success: true,
      message: 'Water intake updated successfully.',
      glasses: currentGlasses,
      goal,
      date: today
    });
  } catch (err) {
    console.error('updateWater error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update water intake.' });
  }
};
