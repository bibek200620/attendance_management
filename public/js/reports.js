// Reports Page Module
window.ReportsPage = {
  render() {
    const today = Utils.getToday();
    const thirtyDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    })();

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-subtitle">View attendance reports and analytics</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-export-csv">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div class="search-filters">
        <select class="filter-select" id="report-class-select">
          <option value="">All Classes</option>
        </select>
        <div class="form-group">
          <label class="form-label">From</label>
          <input type="date" class="form-input" id="report-from" value="${thirtyDaysAgo}">
        </div>
        <div class="form-group">
          <label class="form-label">To</label>
          <input type="date" class="form-input" id="report-to" value="${today}">
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Daily Attendance</h3>
          </div>
          <div class="card-body">
            <div id="daily-chart" class="chart-container"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Attendance Distribution</h3>
          </div>
          <div class="card-body">
            <div id="distribution-chart" class="chart-container"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Student Attendance Report</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total Days</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody id="report-tbody">
                <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
                <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
                <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.loadClasses();
    this.loadReports();
    this.bindEvents();
  },

  bindEvents() {
    const classSelect = document.getElementById('report-class-select');
    const fromDate = document.getElementById('report-from');
    const toDate = document.getElementById('report-to');
    const exportBtn = document.getElementById('btn-export-csv');

    if (classSelect) classSelect.addEventListener('change', () => this.loadReports());
    if (fromDate) fromDate.addEventListener('change', () => this.loadReports());
    if (toDate) toDate.addEventListener('change', () => this.loadReports());

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }
  },

  async loadClasses() {
    try {
      const classes = await Utils.api.get('/api/classes');
      const select = document.getElementById('report-class-select');
      if (select) {
        const options = classes.map(c =>
          `<option value="${c.id}">${Utils.escapeHtml(c.name)} - ${Utils.escapeHtml(c.section)}</option>`
        ).join('');
        select.innerHTML = `<option value="">All Classes</option>${options}`;
      }
    } catch (err) {
      Utils.showToast('Failed to load classes', 'error');
    }
  },

  async loadReports() {
    const classId = document.getElementById('report-class-select')?.value || '';
    const from = document.getElementById('report-from')?.value || '';
    const to = document.getElementById('report-to')?.value || '';

    const params = new URLSearchParams();
    if (classId) params.set('class_id', classId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    try {
      const data = await Utils.api.get(`/api/reports?${params.toString()}`);
      this.renderCharts(data);
      this.renderTable(data.students || []);
    } catch (err) {
      Utils.showToast('Failed to load reports', 'error');
    }
  },

  renderCharts(data) {
    const daily = data.daily || [];

    // Bar chart - Daily Attendance
    const barData = {
      labels: daily.map(d => Utils.formatDateShort(d.date)),
      datasets: [
        { label: 'Present', data: daily.map(d => d.present), color: '#10b981' },
        { label: 'Absent', data: daily.map(d => d.absent), color: '#ef4444' },
        { label: 'Late', data: daily.map(d => d.late), color: '#f59e0b' }
      ]
    };
    Charts.bar('daily-chart', barData, { responsive: true });

    // Doughnut chart - Distribution
    let totalPresent = 0, totalAbsent = 0, totalLate = 0;
    daily.forEach(d => {
      totalPresent += d.present || 0;
      totalAbsent += d.absent || 0;
      totalLate += d.late || 0;
    });

    const doughnutData = {
      labels: ['Present', 'Absent', 'Late'],
      values: [totalPresent, totalAbsent, totalLate],
      colors: ['#10b981', '#ef4444', '#f59e0b']
    };
    Charts.doughnut('distribution-chart', doughnutData, { responsive: true });
  },

  renderTable(students) {
    const tbody = document.getElementById('report-tbody');
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-icon">📊</div>
              <h3 class="empty-title">No Report Data</h3>
              <p class="empty-text">No attendance data found for the selected filters</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = students.map(student => {
      const pct = student.percentage != null ? Math.round(student.percentage) : 0;
      let colorClass = 'red';
      if (pct >= 75) colorClass = 'green';
      else if (pct >= 50) colorClass = 'amber';

      return `
        <tr>
          <td>${Utils.escapeHtml(student.name)}</td>
          <td>${Utils.escapeHtml(student.roll_number)}</td>
          <td><span class="badge badge-present">${student.present || 0}</span></td>
          <td><span class="badge badge-absent">${student.absent || 0}</span></td>
          <td><span class="badge badge-late">${student.late || 0}</span></td>
          <td>${student.total || 0}</td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill ${colorClass}" style="width: ${pct}%"></div>
            </div>
            <span>${pct}%</span>
          </td>
        </tr>
      `;
    }).join('');

    Utils.animateStagger('.data-table tbody tr');
  },

  exportCSV() {
    const classId = document.getElementById('report-class-select')?.value || '';
    const from = document.getElementById('report-from')?.value || '';
    const to = document.getElementById('report-to')?.value || '';

    const params = new URLSearchParams();
    if (classId) params.set('class_id', classId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  }
};
