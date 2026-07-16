// App Router
(function() {
  const pages = {
    dashboard: window.DashboardPage,
    students: window.StudentsPage,
    attendance: window.AttendancePage,
    reports: window.ReportsPage,
    classes: window.ClassesPage,
    settings: window.SettingsPage
  };

  let currentPage = null;

  function navigate(hash) {
    try {
      const page = hash.replace('#', '') || 'dashboard';
      const pageModule = pages[page];
      if (!pageModule) {
        window.location.hash = '#dashboard';
        return;
      }

      // Update nav active state
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
      });

      // Render page
      const content = document.getElementById('app-content');
      if (!content) {
        console.error('Main content container (#app-content) not found.');
        return;
      }
      
      content.innerHTML = pageModule.render();
      content.classList.remove('fade-in');
      void content.offsetWidth; // trigger reflow
      content.classList.add('fade-in');

      // Init page
      if (pageModule.init) {
        pageModule.init();
      }
      currentPage = page;

      // Close mobile sidebar
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      const content = document.getElementById('app-content');
      if (content) {
        content.innerHTML = `
          <div class="card" style="margin: 24px; padding: 24px; border: 1px solid rgba(244,63,94,0.3); background: rgba(244,63,94,0.05);">
            <h2 style="color: #f43f5e; margin-bottom: 12px;">Something went wrong</h2>
            <p style="color: #94a3b8; font-family: monospace; font-size: 0.9rem;">${error.message}</p>
            <button class="btn btn-primary mt-16" onclick="window.location.reload()">Reload Page</button>
          </div>
        `;
      }
    }
  }

  // Listen to hash changes
  window.addEventListener('hashchange', () => navigate(location.hash));

  // Mobile menu toggle
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Handle click on sidebar links to update hash and active class
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const hash = item.getAttribute('href');
      if (hash && hash.startsWith('#')) {
        navigate(hash);
      }
    });
  });

  // Initial navigation
  function initApp() {
    navigate(location.hash || '#dashboard');
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
