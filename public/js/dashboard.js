// Dashboard Page Module
window.DashboardPage = {
  render() {
    const today = Utils.formatDate(Utils.getToday());
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">${today}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card stagger-1" id="stat-students">
          <div class="stat-icon purple">👥</div>
          <div class="stat-value"><span class="skeleton skeleton-text" style="width:60px">&nbsp;</span></div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card stagger-2" id="stat-rate">
          <div class="stat-icon cyan">📊</div>
          <div class="stat-value"><span class="skeleton skeleton-text" style="width:60px">&nbsp;</span></div>
          <div class="stat-label">Attendance Rate</div>
        </div>
        <div class="stat-card stagger-3" id="stat-present">
          <div class="stat-icon green">✅</div>
          <div class="stat-value"><span class="skeleton skeleton-text" style="width:60px">&nbsp;</span></div>
          <div class="stat-label">Present Today</div>
        </div>
        <div class="stat-card stagger-4" id="stat-absent-late">
          <div class="stat-icon amber">⚠️</div>
          <div class="stat-value"><span class="skeleton skeleton-text" style="width:60px">&nbsp;</span></div>
          <div class="stat-label">Absent / Late</div>
        </div>
      </div>

      <div class="grid grid-2-1">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Attendance Trend (Last 7 Days)</h3>
          </div>
          <div class="card-body">
            <div id="trend-chart" class="chart-container"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Activity</h3>
          </div>
          <div class="card-body">
            <div id="activity-feed">
              <div class="activity-list">
                <div class="activity-item"><div class="skeleton skeleton-text"></div></div>
                <div class="activity-item"><div class="skeleton skeleton-text"></div></div>
                <div class="activity-item"><div class="skeleton skeleton-text"></div></div>
                <div class="activity-item"><div class="skeleton skeleton-text"></div></div>
                <div class="activity-item"><div class="skeleton skeleton-text"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.loadStats();
    this.loadTrend();
    this.loadActivity();
    Utils.animateStagger('.stat-card');
  },

  async loadStats() {
    try {
      const stats = await Utils.api.get('/api/stats');
      const studentsEl = document.querySelector('#stat-students .stat-value');
      const rateEl = document.querySelector('#stat-rate .stat-value');
      const presentEl = document.querySelector('#stat-present .stat-value');
      const absentLateEl = document.querySelector('#stat-absent-late .stat-value');
      const absentLateTrend = document.querySelector('#stat-absent-late .stat-trend');

      if (studentsEl) studentsEl.textContent = stats.totalStudents;
      if (rateEl) rateEl.textContent = stats.attendanceRate + '%';
      if (presentEl) presentEl.textContent = stats.todayPresent;
      if (absentLateEl) absentLateEl.textContent = (stats.todayAbsent || 0) + (stats.todayLate || 0);

      // Add trend info to absent/late card
      const trendContainer = document.querySelector('#stat-absent-late');
      if (trendContainer && !trendContainer.querySelector('.stat-trend')) {
        const trendEl = document.createElement('div');
        trendEl.className = 'stat-trend';
        trendEl.textContent = `Absent: ${stats.todayAbsent || 0} / Late: ${stats.todayLate || 0}`;
        trendContainer.appendChild(trendEl);
      }
    } catch (err) {
      Utils.showToast('Failed to load dashboard stats', 'error');
    }
  },

  async loadTrend() {
    try {
      const trend = await Utils.api.get('/api/attendance/trend');
      const labels = trend.map(d => Utils.formatDateShort(d.date));
      const data = {
        labels,
        datasets: [
          { label: 'Present', data: trend.map(d => d.present), color: '#10b981' },
          { label: 'Absent', data: trend.map(d => d.absent), color: '#ef4444' },
          { label: 'Late', data: trend.map(d => d.late), color: '#f59e0b' }
        ]
      };
      Charts.line('trend-chart', data, { responsive: true });
    } catch (err) {
      Utils.showToast('Failed to load attendance trend', 'error');
    }
  },

  async loadActivity() {
    try {
      const recent = await Utils.api.get('/api/attendance/recent');
      const feed = document.getElementById('activity-feed');
      if (!feed) return;

      if (!recent || recent.length === 0) {
        feed.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3 class="empty-title">No Recent Activity</h3>
            <p class="empty-text">Attendance records will appear here</p>
          </div>
        `;
        return;
      }

      const items = recent.map(record => {
        const dotClass = record.status ? record.status.toLowerCase() : '';
        const statusText = record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase() : 'Unknown';
        return `
          <div class="activity-item">
            <div class="activity-dot ${dotClass}"></div>
            <div class="activity-content">
              <div class="activity-text">
                <strong>${Utils.escapeHtml(record.studentName)}</strong> was marked 
                <span class="badge badge-${dotClass}">${statusText}</span> in 
                <strong>${Utils.escapeHtml(record.className)}</strong>
              </div>
              <div class="activity-time">${Utils.timeAgo(record.markedAt)}</div>
            </div>
          </div>
        `;
      }).join('');

      feed.innerHTML = `<div class="activity-list">${items}</div>`;
      Utils.animateStagger('.activity-item');
    } catch (err) {
      Utils.showToast('Failed to load recent activity', 'error');
    }
  }
};
