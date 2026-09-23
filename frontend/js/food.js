// NutriTrack - Food Management (Add Food & Today's Meals CRUD)

let catalogFoods = [];
let todayMeals = [];
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const path = window.location.pathname;

  if (path.includes('add-food.html')) {
    initAppChrome('nav-add-food');
    await initAddFoodPage();
  } else if (path.includes('today.html')) {
    initAppChrome('nav-today');
    await initTodayPage();
  }
});

/* ===================================================
   1. ADD FOOD PAGE LOGIC
   =================================================== */
async function initAddFoodPage() {
  const presetSelect = document.getElementById('preset-food-select');
  const addFoodForm = document.getElementById('add-food-form');
  const clearBtn = document.getElementById('clear-food-btn');

  // Load preset catalog from API
  try {
    const data = await apiRequest('/foods');
    if (data.success && data.foods) {
      catalogFoods = data.foods;
      populatePresetDropdown(data.foods);
    }
  } catch (err) {
    console.error('Failed to load preset catalog:', err);
  }

  // Handle preset selection change
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (!selectedId) return;

      const food = catalogFoods.find(f => String(f.id) === String(selectedId));
      if (food) {
        document.getElementById('food_name').value = food.food_name;
        document.getElementById('quantity').value = food.default_quantity || '1 serving';
        document.getElementById('calories').value = food.calories;
        document.getElementById('protein').value = food.protein;
        document.getElementById('carbohydrates').value = food.carbohydrates;
        document.getElementById('fat').value = food.fat;
        document.getElementById('food_id').value = food.id;

        updateAddFoodPreview();
      }
    });
  }

  // Listen to input changes to update live preview
  ['food_name', 'quantity', 'calories', 'protein', 'carbohydrates', 'fat', 'meal_type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateAddFoodPreview);
      el.addEventListener('change', updateAddFoodPreview);
    }
  });

  // Handle Form Submission
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const food_name = document.getElementById('food_name').value.trim();
      const meal_type = document.getElementById('meal_type').value;
      const quantity = document.getElementById('quantity').value.trim();
      const calories = document.getElementById('calories').value;
      const protein = document.getElementById('protein').value;
      const carbohydrates = document.getElementById('carbohydrates').value;
      const fat = document.getElementById('fat').value;
      const food_id = document.getElementById('food_id').value || null;

      if (!food_name || !meal_type || calories === '') {
        showToast('Please enter food name, meal type, and calories.', 'warning');
        return;
      }

      const submitBtn = addFoodForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

      try {
        await apiRequest('/food-logs', {
          method: 'POST',
          body: JSON.stringify({
            food_name,
            meal_type,
            quantity: quantity || '1 serving',
            calories: parseFloat(calories),
            protein: parseFloat(protein) || 0,
            carbohydrates: parseFloat(carbohydrates) || 0,
            fat: parseFloat(fat) || 0,
            food_id: food_id ? parseInt(food_id, 10) : null
          })
        });

        showToast('Food added successfully!', 'success');
        resetAddFoodForm();

        // Optional quick link or redirect
        const gotoToday = confirm('Food logged successfully! Do you want to view Today’s Meals?');
        if (gotoToday) {
          window.location.href = 'today.html';
        }
      } catch (err) {
        showToast(err.message || 'Failed to add food record.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Clear Button
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAddFoodForm();
      showToast('Form cleared.', 'info');
    });
  }
}

function populatePresetDropdown(foods) {
  const select = document.getElementById('preset-food-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose from preset foods catalog or type below --</option>';
  foods.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = `${f.food_name} (${f.calories} kcal | P:${f.protein}g C:${f.carbohydrates}g F:${f.fat}g)`;
    select.appendChild(opt);
  });
}

function resetAddFoodForm() {
  const form = document.getElementById('add-food-form');
  if (form) form.reset();
  const foodIdEl = document.getElementById('food_id');
  if (foodIdEl) foodIdEl.value = '';
  const preset = document.getElementById('preset-food-select');
  if (preset) preset.value = '';
  updateAddFoodPreview();
}

function updateAddFoodPreview() {
  const name = document.getElementById('food_name')?.value || 'Food Item';
  const cal = document.getElementById('calories')?.value || '0';
  const p = document.getElementById('protein')?.value || '0';
  const c = document.getElementById('carbohydrates')?.value || '0';
  const f = document.getElementById('fat')?.value || '0';
  const meal = document.getElementById('meal_type')?.value || 'Meal';

  const previewName = document.getElementById('preview-name');
  const previewCal = document.getElementById('preview-cal');
  const previewMacros = document.getElementById('preview-macros');
  const previewMeal = document.getElementById('preview-meal');

  if (previewName) previewName.textContent = name;
  if (previewCal) previewCal.textContent = `${cal} kcal`;
  if (previewMacros) previewMacros.textContent = `Protein: ${p}g • Carbs: ${c}g • Fat: ${f}g`;
  if (previewMeal) previewMeal.textContent = meal;
}

/* ===================================================
   2. TODAY'S MEALS PAGE LOGIC (CRUD)
   =================================================== */
async function initTodayPage() {
  await loadTodayMeals();
  setupEditModal();
  setupDeleteModal();
}

async function loadTodayMeals() {
  const tbody = document.getElementById('today-meals-tbody');
  const emptyState = document.getElementById('today-empty-state');
  const tableWrapper = document.getElementById('today-table-wrapper');

  try {
    const data = await apiRequest('/food-logs/today');
    if (!data.success) throw new Error(data.message);

    todayMeals = data.logs || [];

    // Render totals
    const t = data.totals;
    const elCal = document.getElementById('total-today-cal');
    const elP = document.getElementById('total-today-prot');
    const elC = document.getElementById('total-today-carb');
    const elF = document.getElementById('total-today-fat');

    if (elCal) elCal.textContent = `${t.calories} kcal`;
    if (elP) elP.textContent = `${t.protein} g`;
    if (elC) elC.textContent = `${t.carbohydrates} g`;
    if (elF) elF.textContent = `${t.fat} g`;

    if (todayMeals.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableWrapper) tableWrapper.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableWrapper) tableWrapper.style.display = 'block';

    if (tbody) {
      tbody.innerHTML = todayMeals.map(meal => {
        const timeStr = meal.created_at 
          ? new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '-';

        return `
          <tr id="meal-row-${meal.id}">
            <td style="font-weight: 600;">${escapeHtml(meal.food_name)}</td>
            <td><span class="badge badge-info">${meal.meal_type}</span></td>
            <td>${escapeHtml(meal.quantity || '1 serving')}</td>
            <td style="font-weight: 700; color: var(--calorie-color);">${meal.calories} kcal</td>
            <td>${meal.protein} g</td>
            <td>${meal.carbohydrates} g</td>
            <td>${meal.fat} g</td>
            <td style="color: var(--text-muted); font-size: 0.85rem;">${timeStr}</td>
            <td>
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn btn-outline btn-sm edit-meal-btn" data-id="${meal.id}" title="Edit Food">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm delete-meal-btn" data-id="${meal.id}" title="Delete Food">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach button listeners
      document.querySelectorAll('.edit-meal-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
      });

      document.querySelectorAll('.delete-meal-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id')));
      });
    }

  } catch (err) {
    showToast('Failed to load today’s meals.', 'error');
    console.error(err);
  }
}

// Edit Modal Handlers
function setupEditModal() {
  const modal = document.getElementById('edit-meal-modal');
  const closeBtn = document.getElementById('close-edit-modal-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const form = document.getElementById('edit-meal-form');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit_food_id').value;
      const food_name = document.getElementById('edit_food_name').value.trim();
      const meal_type = document.getElementById('edit_meal_type').value;
      const quantity = document.getElementById('edit_quantity').value.trim();
      const calories = document.getElementById('edit_calories').value;
      const protein = document.getElementById('edit_protein').value;
      const carbohydrates = document.getElementById('edit_carbohydrates').value;
      const fat = document.getElementById('edit_fat').value;

      try {
        await apiRequest(`/food-logs/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            food_name,
            meal_type,
            quantity,
            calories: parseFloat(calories),
            protein: parseFloat(protein) || 0,
            carbohydrates: parseFloat(carbohydrates) || 0,
            fat: parseFloat(fat) || 0
          })
        });

        showToast('Food updated successfully!', 'success');
        modal.classList.remove('active');
        await loadTodayMeals();
      } catch (err) {
        showToast(err.message || 'Failed to update record.', 'error');
      }
    });
  }
}

function openEditModal(mealId) {
  const meal = todayMeals.find(m => String(m.id) === String(mealId));
  if (!meal) return;

  document.getElementById('edit_food_id').value = meal.id;
  document.getElementById('edit_food_name').value = meal.food_name;
  document.getElementById('edit_meal_type').value = meal.meal_type;
  document.getElementById('edit_quantity').value = meal.quantity || '1 serving';
  document.getElementById('edit_calories').value = meal.calories;
  document.getElementById('edit_protein').value = meal.protein;
  document.getElementById('edit_carbohydrates').value = meal.carbohydrates;
  document.getElementById('edit_fat').value = meal.fat;

  document.getElementById('edit-meal-modal').classList.add('active');
}

// Delete Modal Handlers
function setupDeleteModal() {
  const modal = document.getElementById('delete-modal');
  const closeBtn = document.getElementById('close-delete-modal-btn');
  const cancelBtn = document.getElementById('cancel-delete-btn');
  const confirmBtn = document.getElementById('confirm-delete-btn');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!pendingDeleteId) return;

      try {
        await apiRequest(`/food-logs/${pendingDeleteId}`, { method: 'DELETE' });
        showToast('Food deleted successfully', 'success');
        modal.classList.remove('active');
        pendingDeleteId = null;
        await loadTodayMeals();
      } catch (err) {
        showToast(err.message || 'Failed to delete record.', 'error');
      }
    });
  }
}

function openDeleteModal(mealId) {
  const meal = todayMeals.find(m => String(m.id) === String(mealId));
  if (!meal) return;

  pendingDeleteId = mealId;
  const targetName = document.getElementById('delete-food-name-target');
  if (targetName) targetName.textContent = meal.food_name;

  document.getElementById('delete-modal').classList.add('active');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
