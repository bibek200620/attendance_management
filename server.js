const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helper ───────────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const avatarColors = [
  '#7c3aed', '#06b6d4', '#f43f5e', '#f59e0b',
  '#10b981', '#6366f1', '#ec4899', '#8b5cf6'
];

// ═══════════════════════════════════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/stats', (req, res) => {
  try {
    const today = todayStr();

    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;

    const todayPresent = db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'present'"
    ).get(today).count;

    const todayAbsent = db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'absent'"
    ).get(today).count;

    const todayLate = db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'late'"
    ).get(today).count;

    const attendanceRate = totalStudents > 0
      ? Math.round((todayPresent / totalStudents) * 100)
      : 0;

    res.json({ totalStudents, totalClasses, todayPresent, todayAbsent, todayLate, attendanceRate });
  } catch (err) {
    console.error('GET /api/stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RECENT ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/attendance/recent', (req, res) => {
  try {
    const records = db.prepare(`
      SELECT a.id, s.name AS studentName, c.name AS className, a.status, a.date, a.marked_at AS markedAt
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      ORDER BY a.marked_at DESC
      LIMIT 20
    `).all();

    res.json(records);
  } catch (err) {
    console.error('GET /api/attendance/recent error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recent attendance' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE TREND (last 7 days)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/attendance/trend', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        date,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late,
        COUNT(*) AS total
      FROM attendance
      WHERE date >= date('now', '-7 days')
      GROUP BY date
      ORDER BY date ASC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('GET /api/attendance/trend error:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendance trend' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/students', (req, res) => {
  try {
    const { class_id, search } = req.query;
    let sql = `
      SELECT s.id, s.name, s.email, s.roll_number, s.class_id,
             c.name AS className, s.avatar_color, s.created_at
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (search) {
      sql += ' AND (s.name LIKE ? OR s.roll_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY s.name ASC';

    const students = db.prepare(sql).all(...params);
    res.json(students);
  } catch (err) {
    console.error('GET /api/students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/api/students', (req, res) => {
  try {
    const { name, email, roll_number, class_id } = req.body;
    if (!name || !roll_number || !class_id) {
      return res.status(400).json({ error: 'name, roll_number and class_id are required' });
    }

    const avatar_color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const result = db.prepare(
      'INSERT INTO students (name, email, roll_number, class_id, avatar_color) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email || '', roll_number, class_id, avatar_color);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(student);
  } catch (err) {
    console.error('POST /api/students error:', err.message);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const { name, email, roll_number, class_id } = req.body;
    const { id } = req.params;

    db.prepare(
      'UPDATE students SET name = ?, email = ?, roll_number = ?, class_id = ? WHERE id = ?'
    ).run(name, email || '', roll_number, class_id, id);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json(student);
  } catch (err) {
    console.error('PUT /api/students/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/students/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/classes', (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT c.id, c.name, c.section, c.subject, c.schedule, c.created_at,
             COUNT(s.id) AS studentCount
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    res.json(classes);
  } catch (err) {
    console.error('GET /api/classes error:', err.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

app.post('/api/classes', (req, res) => {
  try {
    const { name, section, subject, schedule } = req.body;
    if (!name || !section || !subject) {
      return res.status(400).json({ error: 'name, section and subject are required' });
    }

    const result = db.prepare(
      'INSERT INTO classes (name, section, subject, schedule) VALUES (?, ?, ?, ?)'
    ).run(name, section, subject, schedule || '');

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cls);
  } catch (err) {
    console.error('POST /api/classes error:', err.message);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

app.put('/api/classes/:id', (req, res) => {
  try {
    const { name, section, subject, schedule } = req.body;
    const { id } = req.params;

    db.prepare(
      'UPDATE classes SET name = ?, section = ?, subject = ?, schedule = ? WHERE id = ?'
    ).run(name, section, subject, schedule || '', id);

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    res.json(cls);
  } catch (err) {
    console.error('PUT /api/classes/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

app.delete('/api/classes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/classes/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE (by class & date)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/attendance', (req, res) => {
  try {
    const { class_id, date } = req.query;
    if (!class_id || !date) {
      return res.status(400).json({ error: 'class_id and date are required' });
    }

    // Get all students in the class
    const students = db.prepare(
      'SELECT id, name, roll_number, avatar_color FROM students WHERE class_id = ? ORDER BY name ASC'
    ).all(class_id);

    // Get attendance records for this class & date
    const attendanceRows = db.prepare(
      'SELECT student_id, status FROM attendance WHERE class_id = ? AND date = ?'
    ).all(class_id, date);

    const attendanceMap = {};
    for (const row of attendanceRows) {
      attendanceMap[row.student_id] = row.status;
    }

    let present = 0, absent = 0, late = 0, unmarked = 0;

    const records = students.map(s => {
      const status = attendanceMap[s.id] || 'unmarked';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else unmarked++;

      return {
        student_id: s.id,
        studentName: s.name,
        roll_number: s.roll_number,
        avatar_color: s.avatar_color,
        status
      };
    });

    res.json({
      records,
      summary: { present, absent, late, unmarked, total: students.length }
    });
  } catch (err) {
    console.error('GET /api/attendance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', (req, res) => {
  try {
    const { class_id, date, records } = req.body;
    if (!class_id || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'class_id, date and records array are required' });
    }

    const upsert = db.prepare(`
      INSERT OR REPLACE INTO attendance (student_id, class_id, date, status)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        upsert.run(item.student_id, class_id, date, item.status);
      }
    });

    insertMany(records);

    // Build summary
    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late,
        COUNT(*) AS total
      FROM attendance
      WHERE class_id = ? AND date = ?
    `).get(class_id, date);

    res.json({ success: true, summary });
  } catch (err) {
    console.error('POST /api/attendance error:', err.message);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/reports', (req, res) => {
  try {
    const { class_id, from, to, student_id } = req.query;

    // ── Student-level aggregates ──
    let studentSql = `
      SELECT
        s.id, s.name, s.roll_number,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
        COUNT(a.id) AS total
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE 1=1
    `;
    const studentParams = [];

    if (class_id) {
      studentSql += ' AND s.class_id = ?';
      studentParams.push(class_id);
    }
    if (student_id) {
      studentSql += ' AND s.id = ?';
      studentParams.push(student_id);
    }
    if (from) {
      studentSql += ' AND a.date >= ?';
      studentParams.push(from);
    }
    if (to) {
      studentSql += ' AND a.date <= ?';
      studentParams.push(to);
    }

    studentSql += ' GROUP BY s.id ORDER BY s.name ASC';

    const students = db.prepare(studentSql).all(...studentParams).map(row => ({
      ...row,
      percentage: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // ── Daily aggregates ──
    let dailySql = `
      SELECT
        a.date,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const dailyParams = [];

    if (class_id) {
      dailySql += ' AND a.class_id = ?';
      dailyParams.push(class_id);
    }
    if (student_id) {
      dailySql += ' AND a.student_id = ?';
      dailyParams.push(student_id);
    }
    if (from) {
      dailySql += ' AND a.date >= ?';
      dailyParams.push(from);
    }
    if (to) {
      dailySql += ' AND a.date <= ?';
      dailyParams.push(to);
    }

    dailySql += ' GROUP BY a.date ORDER BY a.date ASC';

    const daily = db.prepare(dailySql).all(...dailyParams);

    res.json({ students, daily });
  } catch (err) {
    console.error('GET /api/reports error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── CSV Export ───────────────────────────────────────────────────────────────

app.get('/api/reports/export', (req, res) => {
  try {
    const { class_id, from, to } = req.query;

    let sql = `
      SELECT
        s.name AS studentName, s.roll_number, c.name AS className,
        COUNT(a.id) AS totalDays,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (from) {
      sql += ' AND a.date >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND a.date <= ?';
      params.push(to);
    }

    sql += ' GROUP BY s.id ORDER BY c.name, s.name';

    const rows = db.prepare(sql).all(...params);

    // Build CSV
    const header = 'Student Name,Roll Number,Class,Total Days,Present,Absent,Late,Percentage\n';
    const csvRows = rows.map(r => {
      const pct = r.totalDays > 0 ? Math.round((r.present / r.totalDays) * 100) : 0;
      return `"${r.studentName}","${r.roll_number}","${r.className}",${r.totalDays},${r.present},${r.absent},${r.late},${pct}%`;
    });

    const csv = header + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error('GET /api/reports/export error:', err.message);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Attendance Management System running on http://localhost:${PORT}`);
});
