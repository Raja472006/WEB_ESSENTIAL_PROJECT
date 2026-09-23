// NutriTrack - Water Intake Tracker Controller

let currentGlasses = 0;
let waterGoal = 8;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initAppChrome('nav-water');

  await loadTodayWater();
  setupWaterActions();
});

async function loadTodayWater() {
  try {
    const data = await apiRequest('/water/today');
    if (!data.success) throw new Error(data.message);

    currentGlasses = data.glasses || 0;
    waterGoal = data.goal || 8;

    updateWaterUI();
  } catch (err) {
    showToast('Failed to load water intake.', 'error');
    console.error(err);
  }
}

function updateWaterUI() {
  const countEl = document.getElementById('water-count-display');
  const pctEl = document.getElementById('water-pct-display');
  const fillEl = document.getElementById('water-bottle-fill');
  const glassesContainer = document.getElementById('glasses-grid');
  const tipEl = document.getElementById('water-tip-text');

  if (countEl) countEl.textContent = `${currentGlasses} / ${waterGoal} glasses`;

  const pct = waterGoal > 0 ? Math.round((currentGlasses / waterGoal) * 100) : 0;
  if (pctEl) pctEl.textContent = `${pct}% of daily target`;

  if (fillEl) {
    const clampedHeight = Math.min(100, Math.max(0, pct));
    fillEl.style.height = `${clampedHeight}%`;
    fillEl.textContent = clampedHeight > 15 ? `${pct}%` : '';
  }

  // Render glasses grid
  if (glassesContainer) {
    glassesContainer.innerHTML = '';
    for (let i = 1; i <= Math.max(waterGoal, currentGlasses, 8); i++) {
      const glass = document.createElement('div');
      glass.className = `glass-item ${i <= currentGlasses ? 'active' : ''}`;
      glass.title = `Glass ${i}`;
      glass.innerHTML = '<div class="glass-fill"></div>';
      glass.addEventListener('click', () => setWaterDirect(i));
      glassesContainer.appendChild(glass);
    }
  }

  // Hydration tip
  if (tipEl) {
    if (currentGlasses >= waterGoal) {
      tipEl.textContent = '🎉 Congratulations! You have achieved your daily water intake goal!';
      tipEl.className = 'badge badge-success';
    } else if (currentGlasses >= Math.floor(waterGoal / 2)) {
      tipEl.textContent = '💧 Great progress! You are more than halfway to your daily goal.';
      tipEl.className = 'badge badge-info';
    } else {
      tipEl.textContent = '💡 Tip: Keep a water bottle near your desk to sip throughout the day.';
      tipEl.className = 'badge badge-warning';
    }
  }
}

function setupWaterActions() {
  const addBtn = document.getElementById('add-glass-btn');
  const removeBtn = document.getElementById('remove-glass-btn');
  const addTwoBtn = document.getElementById('add-two-glasses-btn');
  const resetBtn = document.getElementById('reset-water-btn');

  if (addBtn) {
    addBtn.addEventListener('click', () => updateWaterBackend({ action: 'add' }));
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => updateWaterBackend({ action: 'remove' }));
  }

  if (addTwoBtn) {
    addTwoBtn.addEventListener('click', () => updateWaterBackend({ glasses: currentGlasses + 2 }));
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset today’s water intake to 0?')) {
        updateWaterBackend({ glasses: 0 });
      }
    });
  }
}

async function setWaterDirect(count) {
  await updateWaterBackend({ glasses: count });
}

async function updateWaterBackend(payload) {
  try {
    const data = await apiRequest('/water', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data.success) {
      currentGlasses = data.glasses;
      waterGoal = data.goal;
      updateWaterUI();
      showToast(data.message || 'Water updated!', 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update water record.', 'error');
  }
}
