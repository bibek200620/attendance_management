const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'attendance.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    schedule TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    roll_number TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    avatar_color TEXT DEFAULT '#7c3aed',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('present','absent','late')),
    marked_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id, date)
  );
`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;

if (classCount === 0) {
  console.log('Seeding database with initial data...');

  const avatarColors = [
    '#7c3aed', '#06b6d4', '#f43f5e', '#f59e0b',
    '#10b981', '#6366f1', '#ec4899', '#8b5cf6'
  ];

  // ── Classes ──
  const classes = [
    { name: 'Computer Science', section: 'A', subject: 'Data Structures & Algorithms', schedule: 'Mon, Wed, Fri — 9:00 AM' },
    { name: 'Mathematics', section: 'B', subject: 'Linear Algebra', schedule: 'Tue, Thu — 10:00 AM' },
    { name: 'Physics', section: 'A', subject: 'Quantum Mechanics', schedule: 'Mon, Wed — 11:00 AM' },
    { name: 'Chemistry', section: 'B', subject: 'Organic Chemistry', schedule: 'Tue, Thu, Sat — 2:00 PM' },
    { name: 'English', section: 'A', subject: 'Technical Writing', schedule: 'Wed, Fri — 3:00 PM' }
  ];

  const insertClass = db.prepare(
    'INSERT INTO classes (name, section, subject, schedule) VALUES (@name, @section, @subject, @schedule)'
  );

  for (const cls of classes) {
    insertClass.run(cls);
  }

  // ── Students ──
  const students = [
    // Computer Science A (class_id = 1)
    { name: 'Aarav Sharma', email: 'aarav.sharma@university.edu', roll_number: 'CS-101', class_id: 1 },
    { name: 'Diya Patel', email: 'diya.patel@university.edu', roll_number: 'CS-102', class_id: 1 },
    { name: 'Vihaan Reddy', email: 'vihaan.reddy@university.edu', roll_number: 'CS-103', class_id: 1 },
    { name: 'Ananya Gupta', email: 'ananya.gupta@university.edu', roll_number: 'CS-104', class_id: 1 },
    { name: 'Arjun Nair', email: 'arjun.nair@university.edu', roll_number: 'CS-105', class_id: 1 },
    { name: 'Ishita Verma', email: 'ishita.verma@university.edu', roll_number: 'CS-106', class_id: 1 },
    { name: 'Reyansh Kumar', email: 'reyansh.kumar@university.edu', roll_number: 'CS-107', class_id: 1 },

    // Mathematics B (class_id = 2)
    { name: 'Saanvi Iyer', email: 'saanvi.iyer@university.edu', roll_number: 'MA-201', class_id: 2 },
    { name: 'Kabir Singh', email: 'kabir.singh@university.edu', roll_number: 'MA-202', class_id: 2 },
    { name: 'Myra Joshi', email: 'myra.joshi@university.edu', roll_number: 'MA-203', class_id: 2 },
    { name: 'Aditya Kulkarni', email: 'aditya.kulkarni@university.edu', roll_number: 'MA-204', class_id: 2 },
    { name: 'Prisha Mehta', email: 'prisha.mehta@university.edu', roll_number: 'MA-205', class_id: 2 },
    { name: 'Vivaan Bhat', email: 'vivaan.bhat@university.edu', roll_number: 'MA-206', class_id: 2 },

    // Physics A (class_id = 3)
    { name: 'Kiara Deshmukh', email: 'kiara.deshmukh@university.edu', roll_number: 'PH-301', class_id: 3 },
    { name: 'Dhruv Mishra', email: 'dhruv.mishra@university.edu', roll_number: 'PH-302', class_id: 3 },
    { name: 'Anika Rao', email: 'anika.rao@university.edu', roll_number: 'PH-303', class_id: 3 },
    { name: 'Arnav Saxena', email: 'arnav.saxena@university.edu', roll_number: 'PH-304', class_id: 3 },
    { name: 'Navya Pillai', email: 'navya.pillai@university.edu', roll_number: 'PH-305', class_id: 3 },
    { name: 'Shaurya Kapoor', email: 'shaurya.kapoor@university.edu', roll_number: 'PH-306', class_id: 3 },
    { name: 'Riya Chatterjee', email: 'riya.chatterjee@university.edu', roll_number: 'PH-307', class_id: 3 },

    // Chemistry B (class_id = 4)
    { name: 'Advait Banerjee', email: 'advait.banerjee@university.edu', roll_number: 'CH-401', class_id: 4 },
    { name: 'Tara Malhotra', email: 'tara.malhotra@university.edu', roll_number: 'CH-402', class_id: 4 },
    { name: 'Rudra Srinivasan', email: 'rudra.srinivasan@university.edu', roll_number: 'CH-403', class_id: 4 },
    { name: 'Aanya Pandey', email: 'aanya.pandey@university.edu', roll_number: 'CH-404', class_id: 4 },
    { name: 'Atharv Menon', email: 'atharv.menon@university.edu', roll_number: 'CH-405', class_id: 4 },
    { name: 'Zara Sheikh', email: 'zara.sheikh@university.edu', roll_number: 'CH-406', class_id: 4 },

    // English A (class_id = 5)
    { name: 'Sai Prasad', email: 'sai.prasad@university.edu', roll_number: 'EN-501', class_id: 5 },
    { name: 'Meera Krishnan', email: 'meera.krishnan@university.edu', roll_number: 'EN-502', class_id: 5 },
    { name: 'Parth Agarwal', email: 'parth.agarwal@university.edu', roll_number: 'EN-503', class_id: 5 },
    { name: 'Ira Bhatt', email: 'ira.bhatt@university.edu', roll_number: 'EN-504', class_id: 5 },
    { name: 'Yash Tiwari', email: 'yash.tiwari@university.edu', roll_number: 'EN-505', class_id: 5 },
    { name: 'Kavya Mukherjee', email: 'kavya.mukherjee@university.edu', roll_number: 'EN-506', class_id: 5 },
    { name: 'Om Chauhan', email: 'om.chauhan@university.edu', roll_number: 'EN-507', class_id: 5 },
  ];

  const insertStudent = db.prepare(
    'INSERT INTO students (name, email, roll_number, class_id, avatar_color) VALUES (@name, @email, @roll_number, @class_id, @avatar_color)'
  );

  for (const student of students) {
    student.avatar_color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    insertStudent.run(student);
  }

  // ── Attendance Records (last 14 days) ──
  const insertAttendance = db.prepare(
    'INSERT OR IGNORE INTO attendance (student_id, class_id, date, status) VALUES (@student_id, @class_id, @date, @status)'
  );

  const allStudents = db.prepare('SELECT id, class_id FROM students').all();
  const today = new Date();

  const seedAttendance = db.transaction(() => {
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = date.toISOString().split('T')[0];

      for (const student of allStudents) {
        const rand = Math.random();
        let status;
        if (rand < 0.80) {
          status = 'present';
        } else if (rand < 0.90) {
          status = 'absent';
        } else {
          status = 'late';
        }

        insertAttendance.run({
          student_id: student.id,
          class_id: student.class_id,
          date: dateStr,
          status
        });
      }
    }
  });

  seedAttendance();
  console.log('Database seeded successfully.');
}

module.exports = db;
