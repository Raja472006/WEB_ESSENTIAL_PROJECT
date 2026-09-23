const db = require('../config/database');

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period, startDate, endDate } = req.query;

    const now = new Date();
    let start = '';
    let end = formatDate(now);

    if (period === 'today') {
      start = end;
    } else if (period === '30days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      start = formatDate(d);
    } else if (period === 'custom' && startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      // Default to last 7 days
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      start = formatDate(d);
    }

    // 1. Grouped summaries per day
    const [dailyRows] = await db.query(
      `SELECT 
         log_date,
         COUNT(id) as item_count,
         SUM(calories) as total_calories,
         SUM(protein) as total_protein,
         SUM(carbohydrates) as total_carbs,
         SUM(fat) as total_fat
       FROM food_logs
       WHERE user_id = ? AND log_date >= ? AND log_date <= ?
       GROUP BY log_date
       ORDER BY log_date DESC`,
      [userId, start, end]
    );

    // 2. Fetch all individual logs in this range
    const [allLogs] = await db.query(
      `SELECT id, food_name, meal_type, quantity, calories, protein, carbohydrates, fat, log_date, created_at
       FROM food_logs
       WHERE user_id = ? AND log_date >= ? AND log_date <= ?
       ORDER BY log_date DESC, created_at DESC`,
      [userId, start, end]
    );

    // Normalize date strings
    const historyList = dailyRows.map(row => {
      let d = row.log_date;
      if (d instanceof Date) {
        d = d.toISOString().split('T')[0];
      }
      return {
        date: d,
        itemCount: parseInt(row.item_count, 10),
        calories: Math.round((parseFloat(row.total_calories) || 0) * 10) / 10,
        protein: Math.round((parseFloat(row.total_protein) || 0) * 10) / 10,
        carbohydrates: Math.round((parseFloat(row.total_carbs) || 0) * 10) / 10,
        fat: Math.round((parseFloat(row.total_fat) || 0) * 10) / 10
      };
    });

    // Sort ascending for chart display
    const chartList = [...historyList].sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      period: period || '7days',
      range: { start, end },
      count: historyList.length,
      history: historyList,
      logs: allLogs,
      chartData: {
        labels: chartList.map(h => h.date),
        calories: chartList.map(h => h.calories),
        protein: chartList.map(h => h.protein),
        carbohydrates: chartList.map(h => h.carbohydrates),
        fat: chartList.map(h => h.fat)
      }
    });
  } catch (err) {
    console.error('getHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve nutrition history.' });
  }
};
