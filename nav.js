/**
 * TagaDetect - Unified Navigation, Theme, Session, and Toast Handler
 * Included in all separate HTML pages for consistent behavior and persistent state.
 */

const TagaNav = {
  getCurrentUser() {
    return TagaStore.get(STORAGE_KEYS.CURRENT_USER, null);
  },

  getCurrentTheme() {
    return TagaStore.get(STORAGE_KEYS.THEME, 'dark');
  },

  setTheme(theme) {
    TagaStore.set(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      themeBtn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  },

  toggleTheme() {
    const nextTheme = this.getCurrentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    this.toast(`Switched to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} Mode`);
  },

  signOut() {
    TagaStore.set(STORAGE_KEYS.CURRENT_USER, null);
    this.toast('Signed out successfully.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  },

  renderNavbar(activePage = 'home') {
    const user = this.getCurrentUser();
    const theme = this.getCurrentTheme();
    document.documentElement.setAttribute('data-theme', theme);

    const users = TagaStore.get(STORAGE_KEYS.USERS, INITIAL_USERS);
    const pendingCount = users.filter(u => u.role === 'professor' && u.status === 'pending').length;

    const navContainer = document.getElementById('navbar-container');
    if (!navContainer) return;

    const isLoggedIn = !!user;
    const isStudent = isLoggedIn && user.role === 'student';
    const isProf = isLoggedIn && user.role === 'professor';
    const isAdmin = isLoggedIn && user.role === 'admin';

    navContainer.innerHTML = `
      <header class="navbar">
        <a href="index.html" class="nav-brand">
          <div class="nav-brand-logo">T</div>
          <div class="nav-brand-name">Taga<span>Detect</span></div>
        </a>

        <nav class="nav-links">
          <a href="index.html" class="nav-item ${activePage === 'home' ? 'active' : ''}">
            ${isStudent ? 'Enrolled Classes' : (isProf ? 'Classes Handled' : 'Classes')}
          </a>
          <a href="detector.html" class="nav-item ${activePage === 'detector' ? 'active' : ''}">
            AI Detector
          </a>
          <a href="about.html" class="nav-item ${activePage === 'about' ? 'active' : ''}">
            About
          </a>
          <a href="faq.html" class="nav-item ${activePage === 'faq' ? 'active' : ''}">
            FAQ
          </a>
          ${isLoggedIn ? `
            <a href="settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
              Settings
            </a>
          ` : ''}
          ${isAdmin ? `
            <a href="admin.html" class="nav-item ${activePage === 'admin' ? 'active' : ''}">
              Admin Approvals
              ${pendingCount > 0 ? `<span class="badge badge-pending" style="padding: 2px 7px; font-size: 11px; margin-left: 4px;">${pendingCount}</span>` : ''}
            </a>
          ` : ''}
        </nav>

        <div class="nav-actions">
          <!-- Theme Switcher -->
          <button class="theme-toggle-btn" id="theme-toggle-btn" onclick="TagaNav.toggleTheme()" title="Toggle Dark / Light Theme">
            ${theme === 'dark' ? '☀️' : '🌙'}
          </button>

          ${isLoggedIn ? `
            <!-- Logged-in User Profile Pill -->
            <a href="settings.html" class="nav-profile-pill" title="View Profile & Settings" style="text-decoration: none;">
              <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="nav-profile-img" alt="${user.name}" />
              <span class="nav-profile-name">${user.name.split(' ')[0]}</span>
              <span class="nav-profile-role-tag">${user.role}</span>
            </a>

            <!-- Sign Out Button -->
            <button class="btn btn-secondary nav-signout-btn" onclick="TagaNav.signOut()" title="Sign out of your account">
              <span>Sign Out</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          ` : `
            <!-- Logged-out Auth Actions -->
            <a href="login.html" class="btn btn-secondary" style="font-size: 12px; padding: 6px 14px; text-decoration: none;">
              Sign In
            </a>
            <a href="signup.html" class="btn btn-primary" style="font-size: 12px; padding: 6px 16px; text-decoration: none;">
              Sign Up
            </a>
          `}
        </div>
      </header>
    `;
  },

  toast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : (type === 'warning' ? '⚠️' : (type === 'danger' ? '✕' : 'ℹ️'));
    toast.innerHTML = `<span style="font-weight: 700;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOutToast 0.25s forwards';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }
};

// Global click to close modals when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    TagaNav.closeAllModals();
  }
});
