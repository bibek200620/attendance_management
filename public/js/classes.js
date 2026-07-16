// Classes Page Module
window.ClassesPage = {
  classes: [],

  render() {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Classes</h1>
          <p class="page-subtitle">Manage your classes and sections</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-add-class">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Class
          </button>
        </div>
      </div>

      <div id="classes-grid" class="grid grid-3">
        <div class="skeleton-card card"><div class="card-body"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div></div>
        <div class="skeleton-card card"><div class="card-body"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div></div>
        <div class="skeleton-card card"><div class="card-body"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div></div>
      </div>
    `;
  },

  init() {
    this.loadClasses();
    this.bindEvents();
  },

  bindEvents() {
    const addBtn = document.getElementById('btn-add-class');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddModal());
    }

    const grid = document.getElementById('classes-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
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
      this.renderGrid();
    } catch (err) {
      Utils.showToast('Failed to load classes', 'error');
    }
  },

  renderGrid() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;

    if (!this.classes || this.classes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🏫</div>
          <h3 class="empty-title">No Classes Yet</h3>
          <p class="empty-text">Create your first class to get started</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.classes.map(cls => `
      <div class="card fade-in">
        <div class="card-header">
          <h3 class="card-title">${Utils.escapeHtml(cls.name)}</h3>
          <span class="badge badge-info">${Utils.escapeHtml(cls.section)}</span>
        </div>
        <div class="card-body">
          <p>📚 <strong>Subject:</strong> ${Utils.escapeHtml(cls.subject)}</p>
          <p>🕐 <strong>Schedule:</strong> ${Utils.escapeHtml(cls.schedule)}</p>
          <p>👥 <strong>Students:</strong> ${cls.studentCount || 0}</p>
          <p>📅 <strong>Created:</strong> ${Utils.formatDate(cls.created_at)}</p>
        </div>
        <div class="card-footer">
          <button class="btn btn-sm btn-secondary btn-edit" data-id="${cls.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${cls.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Delete
          </button>
        </div>
      </div>
    `).join('');

    Utils.animateStagger('#classes-grid .card');
  },

  getFormHtml(cls = null) {
    return `
      <div class="form-group">
        <label class="form-label">Class Name</label>
        <input type="text" class="form-input" id="modal-class-name" value="${cls ? Utils.escapeHtml(cls.name) : ''}" placeholder="e.g., Class 10" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Section</label>
          <input type="text" class="form-input" id="modal-class-section" value="${cls ? Utils.escapeHtml(cls.section) : ''}" placeholder="e.g., A" required>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" id="modal-class-subject" value="${cls ? Utils.escapeHtml(cls.subject) : ''}" placeholder="e.g., Mathematics" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Schedule</label>
        <input type="text" class="form-input" id="modal-class-schedule" value="${cls ? Utils.escapeHtml(cls.schedule) : ''}" placeholder="e.g., Mon, Wed, Fri 10:00-11:00" required>
      </div>
    `;
  },

  showAddModal() {
    const bodyHtml = this.getFormHtml();
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="modal-save-class">Save Class</button>
    `;
    Utils.showModal('Add Class', bodyHtml, footerHtml);

    setTimeout(() => {
      const saveBtn = document.getElementById('modal-save-class');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveClass());
      }
    }, 100);
  },

  async saveClass() {
    const name = document.getElementById('modal-class-name')?.value.trim();
    const section = document.getElementById('modal-class-section')?.value.trim();
    const subject = document.getElementById('modal-class-subject')?.value.trim();
    const schedule = document.getElementById('modal-class-schedule')?.value.trim();

    if (!name || !section || !subject || !schedule) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await Utils.api.post('/api/classes', { name, section, subject, schedule });
      Utils.closeModal();
      Utils.showToast('Class created successfully!', 'success');
      this.loadClasses();
    } catch (err) {
      Utils.showToast('Failed to create class', 'error');
    }
  },

  showEditModal(id) {
    const cls = this.classes.find(c => String(c.id) === String(id));
    if (!cls) return;

    const bodyHtml = this.getFormHtml(cls);
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="modal-update-class">Update Class</button>
    `;
    Utils.showModal('Edit Class', bodyHtml, footerHtml);

    setTimeout(() => {
      const updateBtn = document.getElementById('modal-update-class');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => this.updateClass(id));
      }
    }, 100);
  },

  async updateClass(id) {
    const name = document.getElementById('modal-class-name')?.value.trim();
    const section = document.getElementById('modal-class-section')?.value.trim();
    const subject = document.getElementById('modal-class-subject')?.value.trim();
    const schedule = document.getElementById('modal-class-schedule')?.value.trim();

    if (!name || !section || !subject || !schedule) {
      Utils.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await Utils.api.put(`/api/classes/${id}`, { name, section, subject, schedule });
      Utils.closeModal();
      Utils.showToast('Class updated successfully!', 'success');
      this.loadClasses();
    } catch (err) {
      Utils.showToast('Failed to update class', 'error');
    }
  },

  confirmDelete(id) {
    const cls = this.classes.find(c => String(c.id) === String(id));
    const className = cls ? Utils.escapeHtml(cls.name) : 'this class';

    const bodyHtml = `<p>Are you sure you want to delete <strong>${className}</strong>? This will also affect all associated students and attendance records. This action cannot be undone.</p>`;
    const footerHtml = `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
      <button class="btn btn-danger" id="modal-confirm-delete">Delete</button>
    `;
    Utils.showModal('Confirm Delete', bodyHtml, footerHtml);

    setTimeout(() => {
      const confirmBtn = document.getElementById('modal-confirm-delete');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.deleteClass(id));
      }
    }, 100);
  },

  async deleteClass(id) {
    try {
      await Utils.api.del(`/api/classes/${id}`);
      Utils.closeModal();
      Utils.showToast('Class deleted successfully!', 'success');
      this.loadClasses();
    } catch (err) {
      Utils.showToast('Failed to delete class', 'error');
    }
  }
};
