// NutriTrack - Authentication Script (Register & Login)

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in and on auth pages, redirect to dashboard
  const token = getToken();
  const path = window.location.pathname;
  if (token && (path.includes('login.html') || path.includes('register.html'))) {
    window.location.href = 'dashboard.html';
    return;
  }

  // 1. Password Visibility Toggles
  const toggleBtns = document.querySelectorAll('.password-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // 2. Register Form Handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('auth-alert');
      alertBox.style.display = 'none';

      const full_name = document.getElementById('full_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm_password = document.getElementById('confirm_password').value;
      const age = document.getElementById('age').value;
      const gender = document.getElementById('gender').value;
      const height = document.getElementById('height').value;
      const weight = document.getElementById('weight').value;

      // Validation
      if (!full_name || !email || !password || !confirm_password) {
        showAuthAlert('Please fill in all required fields.', 'error');
        return;
      }

      if (password.length < 8) {
        showAuthAlert('Password must be at least 8 characters long.', 'error');
        return;
      }

      if (password !== confirm_password) {
        showAuthAlert('Passwords do not match.', 'error');
        return;
      }

      if (age && (parseInt(age, 10) < 5 || parseInt(age, 10) > 120)) {
        showAuthAlert('Please enter a realistic age.', 'error');
        return;
      }

      if (height && (parseFloat(height) < 50 || parseFloat(height) > 260)) {
        showAuthAlert('Please enter a valid height in cm (e.g. 175).', 'error');
        return;
      }

      if (weight && (parseFloat(weight) < 20 || parseFloat(weight) > 300)) {
        showAuthAlert('Please enter a valid weight in kg (e.g. 70).', 'error');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

      try {
        const response = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name,
            email,
            password,
            confirm_password,
            age,
            gender,
            height,
            weight
          })
        });

        showAuthAlert(response.message || 'Account created successfully! Redirecting...', 'success');
        showToast('Registration successful! Redirecting to login...', 'success');

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } catch (err) {
        showAuthAlert(err.message || 'Registration failed. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 3. Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('auth-alert');
      alertBox.style.display = 'none';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember-me')?.checked || false;

      if (!email || !password) {
        showAuthAlert('Please enter both email and password.', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

      try {
        const response = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (response.token) {
          setToken(response.token, rememberMe);
          setUser(response.user, rememberMe);
          showToast('Login successful! Welcome back.', 'success');

          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        }
      } catch (err) {
        showAuthAlert(err.message || 'Invalid email or password.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    // Demo Fill Button
    const demoBtn = document.getElementById('demo-fill-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('email').value = 'john@example.com';
        document.getElementById('password').value = 'Password123!';
      });
    }
  }

  function showAuthAlert(message, type) {
    const alertBox = document.getElementById('auth-alert');
    if (!alertBox) return;
    alertBox.className = `auth-alert ${type}`;
    alertBox.innerHTML = `
      <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
      <span>${message}</span>
    `;
    alertBox.style.display = 'flex';
  }
});
