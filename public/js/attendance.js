// Attendance Page Module
window.AttendancePage = {
  attendanceData: {},
  records: [],

  render() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Take Attendance</h1>
          <p class="page-subtitle">Mark student attendance for today</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-lg" id="btn-submit-attendance" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Submit Attendance
          </button>
        </div>
      </div>

      <div class="search-filters">
        <select class="filter-select" id="attendance-class-select">
          <option value="">-- Select Class --</option>
        </select>
        <input type="date" class="form-input" id="attendance-date" value="${Utils.getToday()}">
      </div>

      <div class="stats-grid">
        <div class="stat-card" id="summary-present">
          <div class="stat-icon green">✅</div>
          <div class="stat-value">0</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card" id="summary-absent">
          <div class="stat-icon amber">❌</div>
          <div class="stat-value">0</div>
          <div class="stat-label">Absent</div>
        </div>
        <div class="stat-card" id="summary-late">
          <div class="stat-icon purple">⏰</div>
          <div class="stat-value">0</div>
          <div class="stat-label">Late</div>
        </div>
        <div class="stat-card" id="summary-unmarked">
          <div class="stat-icon cyan">❓</div>
          <div class="stat-value">0</div>
          <div class="stat-label">Unmarked</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Student List</h3>
          <button class="btn btn-sm btn-success" id="btn-mark-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Mark All Present
          </button>
        </div>
        <div class="card-body">
          <div id="attendance-list" class="attendance-list">
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h3 class="empty-title">Select a Class</h3>
              <p class="empty-text">Choose a class from the dropdown to start taking attendance</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.loadClasses();
    this.bindEvents();
  },

  bindEvents() {
    const classSelect = document.getElementById('attendance-class-select');
    const dateInput = document.getElementById('attendance-date');
    const markAllBtn = document.getElementById('btn-mark-all');
    const submitBtn = document.getElementById('btn-submit-attendance');
    const attendanceList = document.getElementById('attendance-list');

    if (classSelect) {
      classSelect.addEventListener('change', () => this.loadAttendance());
    }

    if (dateInput) {
      dateInput.addEventListener('change', () => this.loadAttendance());
    }

    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => this.markAllPresent());
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitAttendance());
    }

    if (attendanceList) {
      attendanceList.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.toggle-btn');
        if (!toggleBtn) return;

        const item = toggleBtn.closest('.attendance-item');
        if (!item) return;

        const studentId = item.dataset.studentId;
        const status = toggleBtn.dataset.status;

        // Remove all active classes from sibling toggles
        const toggles = item.querySelectorAll('.toggle-btn');
        toggles.forEach(btn => {
          btn.classList.remove('active-present', 'active-absent', 'active-late');
        });

        // Set active class on clicked button
        toggleBtn.classList.add(`active-${status}`);

        // Update attendance data
        this.attendanceData[studentId] = status;

        // Update summary
        this.updateSummary();
      });
    }
  },

  async loadClasses() {
    try {
      const classes = await Utils.api.get('/api/classes');
      const select = document.getElementById('attendance-class-select');
      if (select) {
        const options = classes.map(c =>
          `<option value="${c.id}">${Utils.escapeHtml(c.name)} - ${Utils.escapeHtml(c.section)}</option>`
        ).join('');
        select.innerHTML = `<option value="">-- Select Class --</option>${options}`;
      }
    } catch (err) {
      Utils.showToast('Failed to load classes', 'error');
    }
  },

  async loadAttendance() {
    const classId = document.getElementById('attendance-class-select')?.value;
    const date = document.getElementById('attendance-date')?.value;
    const submitBtn = document.getElementById('btn-submit-attendance');
    const list = document.getElementById('attendance-list');

    if (!classId) {
      if (submitBtn) submitBtn.disabled = true;
      if (list) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3 class="empty-title">Select a Class</h3>
            <p class="empty-text">Choose a class from the dropdown to start taking attendance</p>
          </div>
        `;
      }
      this.resetSummary();
      return;
    }

    if (submitBtn) submitBtn.disabled = false;

    try {
      const data = await Utils.api.get(`/api/attendance?class_id=${classId}&date=${date}`);
      this.records = data.records || [];
      this.attendanceData = {};

      // Populate attendance data from existing records
      this.records.forEach(r => {
        if (r.status) {
          this.attendanceData[r.student_id] = r.status.toLowerCase();
        }
      });

      this.renderList();

      // Update summary from response
      if (data.summary) {
        this.setSummary(data.summary);
      } else {
        this.updateSummary();
      }

      Utils.animateStagger('.attendance-item');
    } catch (err) {
      Utils.showToast('Failed to load attendance', 'error');
    }
  },

  renderList() {
    const list = document.getElementById('attendance-list');
    if (!list) return;

    if (!this.records || this.records.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3 class="empty-title">No Students</h3>
          <p class="empty-text">No students found in this class</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.records.map(student => {
      const status = this.attendanceData[student.student_id] || '';
      const presentActive = status === 'present' ? 'active-present' : '';
      const absentActive = status === 'absent' ? 'active-absent' : '';
      const lateActive = status === 'late' ? 'active-late' : '';

      return `
        <div class="attendance-item" data-student-id="${student.student_id}">
          <div class="student-info">
            <div class="student-avatar">${Utils.generateAvatar(student.studentName, student.avatar_color)}</div>
            <div>
              <div class="student-name">${Utils.escapeHtml(student.studentName)}</div>
              <div class="student-roll">${Utils.escapeHtml(student.roll_number)}</div>
            </div>
          </div>
          <div class="attendance-toggles">
            <button class="toggle-btn ${presentActive}" data-status="present">Present</button>
            <button class="toggle-btn ${absentActive}" data-status="absent">Absent</button>
            <button class="toggle-btn ${lateActive}" data-status="late">Late</button>
          </div>
        </div>
      `;
    }).join('');
  },

  markAllPresent() {
    this.records.forEach(student => {
      this.attendanceData[student.student_id] = 'present';
    });

    // Update all toggle buttons
    const items = document.querySelectorAll('.attendance-item');
    items.forEach(item => {
      const toggles = item.querySelectorAll('.toggle-btn');
      toggles.forEach(btn => {
        btn.classList.remove('active-present', 'active-absent', 'active-late');
        if (btn.dataset.status === 'present') {
          btn.classList.add('active-present');
        }
      });
    });

    this.updateSummary();
    Utils.showToast('All students marked as present', 'info');
  },

  updateSummary() {
    let present = 0, absent = 0, late = 0, unmarked = 0;
    const total = this.records.length;

    this.records.forEach(student => {
      const status = this.attendanceData[student.student_id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;
    });

    this.setSummary({ present, absent, late, unmarked, total });
  },

  setSummary(summary) {
    const presentEl = document.querySelector('#summary-present .stat-value');
    const absentEl = document.querySelector('#summary-absent .stat-value');
    const lateEl = document.querySelector('#summary-late .stat-value');
    const unmarkedEl = document.querySelector('#summary-unmarked .stat-value');

    if (presentEl) presentEl.textContent = summary.present || 0;
    if (absentEl) absentEl.textContent = summary.absent || 0;
    if (lateEl) lateEl.textContent = summary.late || 0;
    if (unmarkedEl) unmarkedEl.textContent = summary.unmarked || 0;
  },

  resetSummary() {
    this.setSummary({ present: 0, absent: 0, late: 0, unmarked: 0 });
  },

  async submitAttendance() {
    const classId = document.getElementById('attendance-class-select')?.value;
    const date = document.getElementById('attendance-date')?.value;

    if (!classId) {
      Utils.showToast('Please select a class', 'error');
      return;
    }

    const records = [];
    for (const [student_id, status] of Object.entries(this.attendanceData)) {
      if (status) {
        records.push({ student_id: parseInt(student_id), status });
      }
    }

    if (records.length === 0) {
      Utils.showToast('Please mark attendance for at least one student', 'error');
      return;
    }

    try {
      await Utils.api.post('/api/attendance', {
        class_id: parseInt(classId),
        date,
        records
      });
      Utils.showToast('Attendance submitted successfully!', 'success');
      this.loadAttendance();
    } catch (err) {
      Utils.showToast('Failed to submit attendance', 'error');
    }
  }
};
