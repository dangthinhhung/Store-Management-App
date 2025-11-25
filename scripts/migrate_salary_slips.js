const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/store.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Create salary_slips table
    db.run(`CREATE TABLE IF NOT EXISTS salary_slips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'COMPLETED',
        note TEXT,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add salary_slip_id to salaries table
    // We can't easily add foreign key constraint to existing table in SQLite without recreation,
    // so we just add the column.
    db.run(`ALTER TABLE salaries ADD COLUMN salary_slip_id INTEGER`);

    console.log("Migration completed: Created salary_slips table and added salary_slip_id to salaries.");
});

db.close();
