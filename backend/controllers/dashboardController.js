const db = require('../config/database');

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date nicely: e.g. "Wednesday, September 23, 2026"
function getFormattedDate(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// GET /api/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayString();

    // 1. Fetch user info
    const [userRows] = await db.query(
      'SELECT id, full_name, email, age, gender, height, weight FROM users WHERE id = ?',
      [userId]
    );
    const user = userRows[0] || { full_name: 'User', email: req.user.email };

    // 2. Fetch goals
    const [goalRows] = await db.query(
      'SELECT calorie_goal, protein_goal, carbohydrate_goal, fat_goal, water_goal FROM nutrition_goals WHERE user_id = ?',
      [userId]
    );
    const goals = goalRows[0] || {
      calorie_goal: 2000,
      protein_goal: 100,
      carbohydrate_goal: 250,
      fat_goal: 70,
      water_goal: 8
    };

    // 3. Fetch today's food logs
    const [todayLogs] = await db.query(
      `SELECT id, food_name, meal_type, quantity, calories, protein, carbohydrates, fat, log_date, created_at
       FROM food_logs
       WHERE user_id = ? AND log_date = ?
       ORDER BY created_at DESC`,
      [userId, today]
    );

    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;

    todayLogs.forEach(log => {
      consumedCalories += parseFloat(log.calories) || 0;
      consumedProtein += parseFloat(log.protein) || 0;
      consumedCarbs += parseFloat(log.carbohydrates) || 0;
      consumedFat += parseFloat(log.fat) || 0;
    });

    consumedCalories = Math.round(consumedCalories * 10) / 10;
    consumedProtein = Math.round(consumedProtein * 10) / 10;
    consumedCarbs = Math.round(consumedCarbs * 10) / 10;
    consumedFat = Math.round(consumedFat * 10) / 10;

    // 4. Fetch today's water
    const [waterRows] = await db.query(
      'SELECT glasses FROM water_logs WHERE user_id = ? AND log_date = ?',
      [userId, today]
    );
    const waterGlasses = waterRows.length > 0 ? waterRows[0].glasses : 0;

    // 5. Calculate Weekly Calories (Monday through Sunday of current week)
    // Find Monday of the current week
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyData = [];
    const dateList = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateList.push({ day: weekDays[i], date: dStr });
    }

    // Query logs for this week
    const startDate = dateList[0].date;
    const endDate = dateList[6].date;

    const [weeklyLogs] = await db.query(
      `SELECT log_date, SUM(calories) as total_cal
       FROM food_logs
       WHERE user_id = ? AND log_date >= ? AND log_date <= ?
       GROUP BY log_date`,
      [userId, startDate, endDate]
    );

    const dateCalMap = {};
    weeklyLogs.forEach(row => {
      // Normalize date string if returned as Date object
      let dateKey = row.log_date;
      if (dateKey instanceof Date) {
        dateKey = dateKey.toISOString().split('T')[0];
      }
      dateCalMap[dateKey] = parseFloat(row.total_cal) || 0;
    });

    dateList.forEach(item => {
      weeklyData.push({
        day: item.day,
        date: item.date,
        calories: dateCalMap[item.date] || 0
      });
    });

    // Helper for percentages capped at reasonable display
    const calcPct = (consumed, goal) => {
      if (!goal || goal <= 0) return 0;
      return Math.round((consumed / goal) * 100);
    };

    return res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      },
      date: today,
      formattedDate: getFormattedDate(today),
      hasLogsToday: todayLogs.length > 0,
      todayCount: todayLogs.length,
      nutrition: {
        calories: {
          consumed: consumedCalories,
          goal: parseFloat(goals.calorie_goal) || 2000,
          unit: 'kcal',
          percentage: calcPct(consumedCalories, goals.calorie_goal)
        },
        protein: {
          consumed: consumedProtein,
          goal: parseFloat(goals.protein_goal) || 100,
          unit: 'g',
          percentage: calcPct(consumedProtein, goals.protein_goal)
        },
        carbohydrates: {
          consumed: consumedCarbs,
          goal: parseFloat(goals.carbohydrate_goal) || 250,
          unit: 'g',
          percentage: calcPct(consumedCarbs, goals.carbohydrate_goal)
        },
        fat: {
          consumed: consumedFat,
          goal: parseFloat(goals.fat_goal) || 70,
          unit: 'g',
          percentage: calcPct(consumedFat, goals.fat_goal)
        },
        water: {
          consumed: waterGlasses,
          goal: parseInt(goals.water_goal, 10) || 8,
          unit: 'glasses',
          percentage: calcPct(waterGlasses, goals.water_goal)
        }
      },
      charts: {
        macros: {
          labels: ['Protein', 'Carbohydrates', 'Fat'],
          data: [consumedProtein, consumedCarbs, consumedFat],
          units: 'g'
        },
        weekly: {
          labels: weeklyData.map(w => w.day),
          data: weeklyData.map(w => w.calories),
          dates: weeklyData.map(w => w.date)
        }
      },
      recentLogs: todayLogs.slice(0, 5)
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
};
