// Students Page Module
window.StudentsPage = {
  classes: [],
  students: [],

  render() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Students</h1>
          <p class="page-subtitle">Manage your students</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-add-student">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Student
          </button>
        </div>
      </div>

      <div class="search-filters">
        <div class="search-box">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" id="student-search" placeholder="Search students...">
        </div>
        <select class="filter-select" id="class-filter">
          <option value="">All Classes</option>
        </select>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="students-tbody">
                <tr><td colspan="5"><div class="skeleton skeleton-text"></div></td></tr>
                <tr><td colspan="5"><div class="skeleton skeleton-text"></div></td></tr>
                <tr><td colspan="5"><div class="skeleton skeleton-text"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    this.loadClasses();
    this.loadStudents();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('student-search');
    const classFilter = document.getElementById('class-filter');
    const addBtn = document.getElementById('btn-add-student');
    const tbody = document.getElementById('students-tbody');

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => this.loadStudents(), 300));
    }

    if (classFilter) {
      classFilter.addEventListener('change', () => this.loadStudents());
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddModal());
    }

    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
          const id = editBtn.dataset.id;
          this.showEditModal(id);
        }
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          this.confirmDelete(id);
        }
      });
    }
  },

  async loadClasses() {
    try {
      this.classes = await Utils.api.get('/api/classes');
      const filter = document.getElementById('class-filter');
      if (filter) {
        const options = this.classes.map(c =>
          `<option value="${c.id}">${Utils.escapeHtml(c.name)} - ${Utils.escapeHtml(c.section)}</option>`
        ).join('');
        filter.innerHTML = `<option value="">All Classes</option>${options}`;
      }
    } catch (err) {
      Utils.showToast('Failed to load classes', 'error');
    }
  },

  async loadStudents() {
    try {
      const search = document.getElementById('student-search')?.value || '';
      const classId = document.getElementById('class-filter')?.value || '';
      const params = new URLSearchParams();
      if (classId) params.set('class_id', classId);
      if (search) params.set('search', search);

      this.students = await Utils.api.get(`/api/students?${params.toString()}`);
      this.renderTable();
    } catch (err) {
      Utils.showToast('Failed to load students', 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;

    if (!this.students || this.students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-icon">🎓</div>
              <h3 class="empty-title">No Students Found</h3>
              <p class="empty-text">Add your first student to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.students.map(student => `
      <tr>
        <td>
          <div class="student-info">
            ${Utils.generateAvatar(student.name, student.avatar_color)}
            <span class="student-name">${Utils.escapeHtml(student.name)}</span>
          </div>
        </td>
        <td>${Utils.escapeHtml(student.roll_number)}</td>
        <td><span class="badge badge-info">${Utils.escapeHtml(student.className)}</span></td>
        <td>${Utils.escapeHtml(student.email)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-icon btn-edit" data-id="${student.id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-sm btn-icon btn-danger btn-delete" data-id="${student.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    Utils.animateStagger('.data-table tbody tr');
  },

  getFormHtml(student = null) {
    const classOptions = this.classes.map(c => {
      const selected = student && student.class_id === c.id ? 'selected' : '';
      return `<option value="${c.id}" ${selected}>${Utils.escapeHtml(c.name)} - ${Utils.escapeHtml(c.section)}</option>`;
    }).join('');

    return `
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input" id="modal-student-name" value="${student ? Utils.escapeHtml(student.name) : ''}" placeholder="Enter student name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" id="modal-student-email" value="${student ? Utils.escapeHtml(student.email) : ''}" placeholder="Enter email address" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Roll Number</label>
          <input type="text" class="form-input" id="modal-student-roll" value="${student ? Utils.escapeHtml(student.roll_number) : ''}" placeholder="Enter roll number" required>
        </div>
        <div class="form-group">
          <label class="form-label">Class</label>
          <select class="form-select" id="modal-student-class" required>
            <option value="">Select Class</option>
            ${classOptions}
          </select>
        </div>
      </div>
    `;
  },

  showAddModal() {
    const bodyHtml = this.getFormHtml();
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="modal-save-student">Save Student</button>
    `;
    Utils.showModal('Add Student', bodyHtml, footerHtml);

    setTimeout(() => {
      const saveBtn = document.getElementById('modal-save-student');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveStudent());
      }
    }, 100);
  },

  async saveStudent() {
    const name = document.getElementById('modal-student-name')?.value.trim();
    const email = document.getElementById('modal-student-email')?.value.trim();
    const roll_number = document.getElementById('modal-student-roll')?.value.trim();
    const class_id = document.getElementById('modal-student-class')?.value;

    if (!name || !email || !roll_number || !class_id) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await Utils.api.post('/api/students', { name, email, roll_number, class_id: parseInt(class_id) });
      Utils.closeModal();
      Utils.showToast('Student added successfully!', 'success');
      this.loadStudents();
    } catch (err) {
      Utils.showToast('Failed to add student', 'error');
    }
  },

  showEditModal(id) {
    const student = this.students.find(s => String(s.id) === String(id));
    if (!student) return;

    const bodyHtml = this.getFormHtml(student);
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="modal-update-student">Update Student</button>
    `;
    Utils.showModal('Edit Student', bodyHtml, footerHtml);

    setTimeout(() => {
      const updateBtn = document.getElementById('modal-update-student');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => this.updateStudent(id));
      }
    }, 100);
  },

  async updateStudent(id) {
    const name = document.getElementById('modal-student-name')?.value.trim();
    const email = document.getElementById('modal-student-email')?.value.trim();
    const roll_number = document.getElementById('modal-student-roll')?.value.trim();
    const class_id = document.getElementById('modal-student-class')?.value;

    if (!name || !email || !roll_number || !class_id) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await Utils.api.put(`/api/students/${id}`, { name, email, roll_number, class_id: parseInt(class_id) });
      Utils.closeModal();
      Utils.showToast('Student updated successfully!', 'success');
      this.loadStudents();
    } catch (err) {
      Utils.showToast('Failed to update student', 'error');
    }
  },

  confirmDelete(id) {
    const student = this.students.find(s => String(s.id) === String(id));
    const studentName = student ? Utils.escapeHtml(student.name) : 'this student';

    const bodyHtml = `<p>Are you sure you want to delete <strong>${studentName}</strong>? This action cannot be undone.</p>`;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-danger" id="modal-confirm-delete">Delete</button>
    `;
    Utils.showModal('Confirm Delete', bodyHtml, footerHtml);

    setTimeout(() => {
      const confirmBtn = document.getElementById('modal-confirm-delete');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.deleteStudent(id));
      }
    }, 100);
  },

  async deleteStudent(id) {
    try {
      await Utils.api.del(`/api/students/${id}`);
      Utils.closeModal();
      Utils.showToast('Student deleted successfully!', 'success');
      this.loadStudents();
    } catch (err) {
      Utils.showToast('Failed to delete student', 'error');
    }
  }
};
