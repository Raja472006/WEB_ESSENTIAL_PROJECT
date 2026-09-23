// NutriTrack - User Profile & BMI Controller

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  initAppChrome('nav-profile');

  await loadProfile();
  setupProfileForm();
  setupLiveBMICalculation();
});

async function loadProfile() {
  try {
    const data = await apiRequest('/profile');
    if (!data.success) throw new Error(data.message);

    const u = data.user;
    document.getElementById('full_name').value = u.full_name || '';
    document.getElementById('email').value = u.email || '';
    document.getElementById('age').value = u.age || '';
    document.getElementById('gender').value = u.gender || '';
    document.getElementById('height').value = u.height || '';
    document.getElementById('weight').value = u.weight || '';

    // Update avatar initial
    const avatar = document.getElementById('profile-avatar-large');
    if (avatar && u.full_name) {
      avatar.textContent = u.full_name.charAt(0).toUpperCase();
    }

    renderBMIDisplay(data.bmiData, u.height, u.weight);

  } catch (err) {
    showToast('Failed to load profile data.', 'error');
    console.error(err);
  }
}

function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value.trim();
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;

    if (!full_name) {
      showToast('Please enter your full name.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Profile...';

    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name, age, gender, height, weight })
      });

      if (data.success) {
        showToast('Profile updated successfully!', 'success');

        // Update stored user
        const stored = getUser() || {};
        setUser({ ...stored, ...data.user });

        // Update UI
        initAppChrome('nav-profile');
        renderBMIDisplay(data.bmiData, height, weight);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function setupLiveBMICalculation() {
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');

  const recalculate = () => {
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      const bmiVal = Math.round((w / (hM * hM)) * 10) / 10;

      let category = 'Normal';
      let badgeClass = 'badge-success';
      let description = 'Healthy weight range.';

      if (bmiVal < 18.5) {
        category = 'Underweight';
        badgeClass = 'badge-warning';
        description = 'Underweight range.';
      } else if (bmiVal >= 18.5 && bmiVal < 25) {
        category = 'Normal';
        badgeClass = 'badge-success';
        description = 'Healthy weight range.';
      } else if (bmiVal >= 25 && bmiVal < 30) {
        category = 'Overweight';
        badgeClass = 'badge-warning';
        description = 'Overweight range.';
      } else {
        category = 'Obesity';
        badgeClass = 'badge-danger';
        description = 'Obesity range.';
      }

      renderBMIDisplay({ bmi: bmiVal, category, badgeClass, description }, h, w);
    }
  };

  if (heightInput) heightInput.addEventListener('input', recalculate);
  if (weightInput) weightInput.addEventListener('input', recalculate);
}

function renderBMIDisplay(bmiData, height, weight) {
  const bmiNumber = document.getElementById('bmi-number-display');
  const bmiBadge = document.getElementById('bmi-category-badge');
  const bmiDesc = document.getElementById('bmi-desc-display');
  const statHeight = document.getElementById('bmi-stat-height');
  const statWeight = document.getElementById('bmi-stat-weight');

  if (statHeight) statHeight.textContent = height ? `${height} cm` : '-';
  if (statWeight) statWeight.textContent = weight ? `${weight} kg` : '-';

  if (!bmiData || bmiData.bmi === null) {
    if (bmiNumber) bmiNumber.textContent = '--';
    if (bmiBadge) {
      bmiBadge.textContent = 'Not Available';
      bmiBadge.className = 'badge badge-secondary';
    }
    if (bmiDesc) bmiDesc.textContent = 'Enter height and weight to calculate your BMI.';
    return;
  }

  if (bmiNumber) bmiNumber.textContent = bmiData.bmi;
  if (bmiBadge) {
    bmiBadge.textContent = bmiData.category;
    bmiBadge.className = `badge ${bmiData.badgeClass || 'badge-success'}`;
  }
  if (bmiDesc) bmiDesc.textContent = bmiData.description || '';
}
