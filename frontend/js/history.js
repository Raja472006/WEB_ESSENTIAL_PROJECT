// NutriTrack - Food History Controller

let currentPeriod = '7days';
let historyChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initAppChrome('nav-history');

  setupPeriodFilters();
  setupCustomDateRange();
  await loadHistory(currentPeriod);
});

function setupPeriodFilters() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', async () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const period = pill.getAttribute('data-period');
      currentPeriod = period;

      const customRangeBox = document.getElementById('custom-date-box');
      if (period === 'custom') {
        if (customRangeBox) customRangeBox.style.display = 'flex';
      } else {
        if (customRangeBox) customRangeBox.style.display = 'none';
        await loadHistory(period);
      }
    });
  });
}

function setupCustomDateRange() {
  const applyBtn = document.getElementById('apply-custom-date-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const start = document.getElementById('start-date-input').value;
      const end = document.getElementById('end-date-input').value;

      if (!start || !end) {
        showToast('Please select both start and end dates.', 'warning');
        return;
      }

      if (start > end) {
        showToast('Start date cannot be after end date.', 'warning');
        return;
      }

      await loadHistory('custom', start, end);
    });
  }

  // Prepopulate today in custom date inputs
  const today = new Date().toISOString().split('T')[0];
  const startInput = document.getElementById('start-date-input');
  const endInput = document.getElementById('end-date-input');
  if (startInput && endInput) {
    startInput.value = today;
    endInput.value = today;
  }
}

async function loadHistory(period, startDate = '', endDate = '') {
  const tbody = document.getElementById('history-table-tbody');
  const emptyState = document.getElementById('history-empty-state');
  const tableWrapper = document.getElementById('history-table-wrapper');
  const chartCard = document.getElementById('history-chart-card');

  let endpoint = `/history?period=${period}`;
  if (period === 'custom' && startDate && endDate) {
    endpoint += `&startDate=${startDate}&endDate=${endDate}`;
  }

  try {
    const data = await apiRequest(endpoint);
    if (!data.success) throw new Error(data.message);

    const history = data.history || [];

    if (history.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableWrapper) tableWrapper.style.display = 'none';
      if (chartCard) chartCard.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableWrapper) tableWrapper.style.display = 'block';
    if (chartCard) chartCard.style.display = 'block';

    // Populate Table
    if (tbody) {
      tbody.innerHTML = history.map(item => `
        <tr>
          <td style="font-weight: 600;">
            <i class="fa-regular fa-calendar" style="color: var(--primary); margin-right: 0.4rem;"></i>
            ${formatDisplayDate(item.date)}
          </td>
          <td><span class="badge badge-secondary">${item.itemCount} items</span></td>
          <td style="font-weight: 700; color: var(--calorie-color);">${item.calories} kcal</td>
          <td>${item.protein} g</td>
          <td>${item.carbohydrates} g</td>
          <td>${item.fat} g</td>
        </tr>
      `).join('');
    }

    // Render Historical Trend Chart
    renderHistoryChart(data.chartData);

  } catch (err) {
    showToast('Failed to load nutrition history.', 'error');
    console.error(err);
  }
}

function renderHistoryChart(chartData) {
  const ctx = document.getElementById('historyChart')?.getContext('2d');
  if (!ctx) return;

  if (historyChartInstance) {
    historyChartInstance.destroy();
  }

  historyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Calories (kcal)',
          data: chartData.calories,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'Protein (g)',
          data: chartData.protein,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          yAxisID: 'y1'
        },
        {
          label: 'Carbohydrates (g)',
          data: chartData.carbohydrates,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          tension: 0.35,
          yAxisID: 'y1'
        },
        {
          label: 'Fat (g)',
          data: chartData.fat,
          borderColor: '#ec4899',
          backgroundColor: 'transparent',
          tension: 0.35,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Inter', size: 12 } }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Calories (kcal)', font: { family: 'Inter' } },
          grid: { color: '#f1f5f9' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Macros (g)', font: { family: 'Inter' } },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
