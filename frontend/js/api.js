// NutriTrack - API Helper & Utilities

const API_BASE_URL = window.location.origin.includes('5000') 
  ? `${window.location.origin}/api` 
  : 'http://localhost:5000/api';

const TOKEN_KEY = 'nutritrack_token';
const USER_KEY = 'nutritrack_user';

// Toast Notification Manager
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Token & User Storage Helpers
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token, remember = false) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

function getUser() {
  const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function setUser(user, remember = false) {
  const str = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(USER_KEY, str);
  } else {
    sessionStorage.setItem(USER_KEY, str);
  }
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// Route Protection Guard
function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Global API Request Wrapper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle session expiry / unauthorized
    if (response.status === 401) {
      clearAuth();
      showToast('Session expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      console.error(`[API Error] ${endpoint}:`, err);
    }
    throw err;
  }
}

// Initialize Sidebar & User Dropdown across pages
function initAppChrome(activeNavId) {
  const user = getUser();

  // Highlight active link
  if (activeNavId) {
    const link = document.getElementById(activeNavId);
    if (link) link.classList.add('active');
  }

  // Populate user badge in sidebar & header
  if (user) {
    const userNames = document.querySelectorAll('.user-name-display');
    userNames.forEach(el => el.textContent = user.full_name || 'User');

    const userEmails = document.querySelectorAll('.user-email-display');
    userEmails.forEach(el => el.textContent = user.email || '');

    const userAvatars = document.querySelectorAll('.user-avatar');
    userAvatars.forEach(el => {
      if (user.full_name) {
        el.textContent = user.full_name.charAt(0).toUpperCase();
      }
    });
  }

  // Mobile sidebar toggles
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.topbar-toggle');
  const closeBtn = document.querySelector('.sidebar-close-btn');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });
  }

  if (closeBtn && sidebar && overlay) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Logout buttons
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      showToast('Logged out successfully.', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    });
  });
}
