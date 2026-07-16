// Settings Page Module
window.SettingsPage = {
  render() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Manage your preferences</p>
        </div>
      </div>

      <div class="card">
        <div class="card-body">

          <div class="settings-section stagger-1">
            <h3 class="settings-section-title">👤 Profile</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="setting-name" value="Admin User">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="setting-email" value="admin@school.edu">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input type="text" class="form-input" id="setting-role" value="Administrator" readonly>
            </div>
          </div>

          <div class="settings-section stagger-2">
            <h3 class="settings-section-title">⚙️ Preferences</h3>

            <div class="setting-item">
              <div>
                <div class="setting-label">Dark Mode</div>
                <div class="setting-description">Enable dark mode for the interface</div>
              </div>
              <div class="toggle-switch active" id="toggle-dark-mode"></div>
            </div>

            <div class="setting-item">
              <div>
                <div class="setting-label">Email Notifications</div>
                <div class="setting-description">Receive email alerts for attendance updates</div>
              </div>
              <div class="toggle-switch" id="toggle-notifications"></div>
            </div>

            <div class="setting-item">
              <div>
                <div class="setting-label">Auto-save Attendance</div>
                <div class="setting-description">Automatically save attendance records as you mark them</div>
              </div>
              <div class="toggle-switch" id="toggle-autosave"></div>
            </div>
          </div>

          <div class="settings-section stagger-3">
            <h3 class="settings-section-title">ℹ️ About</h3>

            <div class="setting-item">
              <div class="setting-label">Version</div>
              <div class="setting-description">1.0.0</div>
            </div>

            <div class="setting-item">
              <div class="setting-label">Developer</div>
              <div class="setting-description">Attendance Management System</div>
            </div>

            <div class="setting-item">
              <div class="setting-label">License</div>
              <div class="setting-description">MIT License</div>
            </div>
          </div>

        </div>
        <div class="card-footer">
          <button class="btn btn-primary" id="btn-save-settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Changes
          </button>
        </div>
      </div>
    `;
  },

  init() {
    this.bindEvents();
    Utils.animateStagger('.settings-section');
  },

  bindEvents() {
    // Toggle switch click handlers
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
      });
    });

    // Save button
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        Utils.showToast('Settings saved successfully!', 'success');
      });
    }
  }
};
