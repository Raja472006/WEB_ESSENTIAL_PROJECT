// NutriTrack - Dashboard Controller

let macroChart = null;
let weeklyChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initAppChrome('nav-dashboard');

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const data = await apiRequest('/dashboard');
    if (!data.success) throw new Error(data.message);

    // 1. Header & Dates
    const greetingEl = document.getElementById('user-greeting-name');
    if (greetingEl) greetingEl.textContent = data.user.full_name || 'Health Explorer';

    const dateDisplay = document.getElementById('dashboard-date-display');
    if (dateDisplay) dateDisplay.textContent = data.formattedDate || new Date().toDateString();

    // 2. Nutrition Cards
    const nut = data.nutrition;

    // Calories
    updateStatCard('cal', nut.calories.consumed, nut.calories.goal, nut.calories.percentage, 'kcal');
    // Protein
    updateStatCard('protein', nut.protein.consumed, nut.protein.goal, nut.protein.percentage, 'g');
    // Carbs
    updateStatCard('carbs', nut.carbohydrates.consumed, nut.carbohydrates.goal, nut.carbohydrates.percentage, 'g');
    // Fat
    updateStatCard('fat', nut.fat.consumed, nut.fat.goal, nut.fat.percentage, 'g');
    // Water
    updateStatCard('water', nut.water.consumed, nut.water.goal, nut.water.percentage, 'glasses');

    // 3. Empty State Banner if no logs today
    const emptyBanner = document.getElementById('today-empty-banner');
    const recentActivityCard = document.getElementById('recent-activity-card');
    if (emptyBanner && recentActivityCard) {
      if (!data.hasLogsToday) {
        emptyBanner.style.display = 'block';
        recentActivityCard.style.display = 'none';
      } else {
        emptyBanner.style.display = 'none';
        recentActivityCard.style.display = 'block';
        renderRecentLogs(data.recentLogs);
      }
    }

    // 4. Render Charts
    renderMacroChart(data.charts.macros);
    renderWeeklyChart(data.charts.weekly);

  } catch (err) {
    showToast('Failed to load dashboard data.', 'error');
    console.error(err);
  }
}

function updateStatCard(prefix, consumed, goal, percentage, unit) {
  const consumedEl = document.getElementById(`${prefix}-consumed`);
  const goalEl = document.getElementById(`${prefix}-goal`);
  const barEl = document.getElementById(`${prefix}-bar`);
  const pctEl = document.getElementById(`${prefix}-pct`);

  if (consumedEl) consumedEl.textContent = `${consumed} / ${goal} ${unit}`;
  if (goalEl) goalEl.textContent = `Goal: ${goal} ${unit}`;
  if (pctEl) pctEl.textContent = `${percentage}%`;
  if (barEl) {
    const clampedPct = Math.min(100, Math.max(0, percentage));
    barEl.style.width = `${clampedPct}%`;
  }
}

function renderRecentLogs(logs) {
  const container = document.getElementById('recent-logs-list');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No food logged today.</p>';
    return;
  }

  container.innerHTML = logs.map(log => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
      <div>
        <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${escapeHtml(log.food_name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">
          <span class="badge badge-info" style="font-size: 0.7rem; padding: 0.15rem 0.5rem; margin-right: 0.35rem;">${log.meal_type}</span>
          ${escapeHtml(log.quantity || '1 serving')}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: var(--calorie-color); font-size: 0.95rem;">${log.calories} kcal</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">P: ${log.protein}g | C: ${log.carbohydrates}g | F: ${log.fat}g</div>
      </div>
    </div>
  `).join('');
}

// Chart 1: Daily Macronutrients (Doughnut)
function renderMacroChart(macroData) {
  const ctx = document.getElementById('macroChart')?.getContext('2d');
  if (!ctx) return;

  const total = (macroData.data[0] || 0) + (macroData.data[1] || 0) + (macroData.data[2] || 0);

  if (macroChart) macroChart.destroy();

  const dataValues = total > 0 ? macroData.data : [1, 1, 1];
  const bgColors = total > 0 
    ? ['#3b82f6', '#10b981', '#ec4899'] 
    : ['#e2e8f0', '#e2e8f0', '#e2e8f0'];

  macroChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: total > 0 ? macroData.labels : ['No logs yet', '', ''],
      datasets: [{
        data: dataValues,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: total > 0 ? 6 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 12, weight: 600 },
            usePointStyle: true,
            padding: 18
          }
        },
        tooltip: {
          enabled: total > 0,
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return ` ${context.label}: ${val}g (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// Chart 2: Weekly Calories (Bar Chart)
function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById('weeklyChart')?.getContext('2d');
  if (!ctx) return;

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyData.labels,
      datasets: [{
        label: 'Calories Consumed (kcal)',
        data: weeklyData.data,
        backgroundColor: '#10b981',
        hoverBackgroundColor: '#059669',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 38
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', weight: 700 },
          bodyFont: { family: 'Inter' },
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} kcal`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11, weight: 500 }, color: '#64748b' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
        }
      }
    }
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
