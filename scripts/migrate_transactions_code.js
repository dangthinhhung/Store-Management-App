const db = require('../src/config/database');

db.serialize(() => {
    // 1. Add code column
    db.run("ALTER TABLE transactions ADD COLUMN code TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error adding column:", err);
            return;
        }
        console.log("Column 'code' added or already exists.");

        // 2. Backfill existing transactions
        db.all("SELECT id FROM transactions WHERE code IS NULL OR code = '' ORDER BY created_at ASC", [], (err, rows) => {
            if (err) {
                console.error("Error fetching transactions:", err);
                return;
            }

            console.log(`Found ${rows.length} transactions to backfill.`);

            let count = 0;
            rows.forEach((row, index) => {
                const code = 'KHAC' + (index + 1).toString().padStart(6, '0');
                db.run("UPDATE transactions SET code = ? WHERE id = ?", [code, row.id], (err) => {
                    if (err) console.error(`Error updating transaction ${row.id}:`, err);
                    else {
                        count++;
                        if (count === rows.length) {
                            console.log("Backfill completed.");
                        }
                    }
                });
            });
        });
    });
});
