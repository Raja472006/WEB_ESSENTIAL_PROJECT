// NutriTrack - Nutrition Goals Controller

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initAppChrome('nav-goals');

  await loadGoals();
  setupGoalForm();
});

async function loadGoals() {
  try {
    const data = await apiRequest('/goals');
    if (!data.success) throw new Error(data.message);

    const g = data.goals;
    document.getElementById('calorie_goal').value = g.calorie_goal;
    document.getElementById('protein_goal').value = g.protein_goal;
    document.getElementById('carbohydrate_goal').value = g.carbohydrate_goal;
    document.getElementById('fat_goal').value = g.fat_goal;
    document.getElementById('water_goal').value = g.water_goal;

    updateMacroBreakdownPreview();
  } catch (err) {
    showToast('Failed to load goals.', 'error');
    console.error(err);
  }
}

function setupGoalForm() {
  const form = document.getElementById('goals-form');
  const resetBtn = document.getElementById('reset-recommended-goals-btn');

  // Input listeners for preview calculation
  ['calorie_goal', 'protein_goal', 'carbohydrate_goal', 'fat_goal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateMacroBreakdownPreview);
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const calorie_goal = parseFloat(document.getElementById('calorie_goal').value);
      const protein_goal = parseFloat(document.getElementById('protein_goal').value);
      const carbohydrate_goal = parseFloat(document.getElementById('carbohydrate_goal').value);
      const fat_goal = parseFloat(document.getElementById('fat_goal').value);
      const water_goal = parseInt(document.getElementById('water_goal').value, 10);

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Goals...';

      try {
        const response = await apiRequest('/goals', {
          method: 'PUT',
          body: JSON.stringify({
            calorie_goal,
            protein_goal,
            carbohydrate_goal,
            fat_goal,
            water_goal
          })
        });

        showToast(response.message || 'Goals updated successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to save goals.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Recommended Standard Preset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('calorie_goal').value = 2000;
      document.getElementById('protein_goal').value = 100;
      document.getElementById('carbohydrate_goal').value = 250;
      document.getElementById('fat_goal').value = 70;
      document.getElementById('water_goal').value = 8;
      updateMacroBreakdownPreview();
      showToast('Loaded recommended balanced nutrition values.', 'info');
    });
  }
}

function updateMacroBreakdownPreview() {
  const cal = parseFloat(document.getElementById('calorie_goal')?.value) || 2000;
  const p = parseFloat(document.getElementById('protein_goal')?.value) || 0;
  const c = parseFloat(document.getElementById('carbohydrate_goal')?.value) || 0;
  const f = parseFloat(document.getElementById('fat_goal')?.value) || 0;

  // Caloric calculations: P: 4 kcal/g, C: 4 kcal/g, F: 9 kcal/g
  const pCal = p * 4;
  const cCal = c * 4;
  const fCal = f * 9;
  const totalMacroCal = pCal + cCal + fCal;

  const pPct = totalMacroCal > 0 ? Math.round((pCal / totalMacroCal) * 100) : 0;
  const cPct = totalMacroCal > 0 ? Math.round((cCal / totalMacroCal) * 100) : 0;
  const fPct = totalMacroCal > 0 ? Math.round((fCal / totalMacroCal) * 100) : 0;

  const barP = document.getElementById('preview-bar-p');
  const barC = document.getElementById('preview-bar-c');
  const barF = document.getElementById('preview-bar-f');
  const macroSummaryText = document.getElementById('macro-summary-text');

  if (barP) barP.style.width = `${pPct}%`;
  if (barC) barC.style.width = `${cPct}%`;
  if (barF) barF.style.width = `${fPct}%`;

  if (macroSummaryText) {
    macroSummaryText.textContent = `Protein: ${pPct}% (${pCal} kcal) • Carbs: ${cPct}% (${cCal} kcal) • Fat: ${fPct}% (${fCal} kcal)`;
  }
}
