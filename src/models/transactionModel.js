const db = require('../config/database');

const Transaction = {
    create: (data, callback) => {
        // Generate code: KHAC + 6 digits
        // We need to count existing manual transactions to generate the next code
        // Since we backfilled, we can just count all transactions where code starts with 'KHAC'
        db.get("SELECT COUNT(*) as count FROM transactions WHERE code LIKE 'KHAC%'", [], (err, row) => {
            if (err) return callback(err);

            const nextNumber = (row.count + 1).toString().padStart(6, '0');
            const code = 'KHAC' + nextNumber;

            const sql = `INSERT INTO transactions (code, type, amount, transaction_name, description, payment_method, customer_id, transaction_date, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
            db.run(sql, [
                code,
                data.type,
                data.amount,
                data.transaction_name,
                data.description,
                data.payment_method || 'Tiền mặt',
                data.customer_id || null,
                data.transaction_date || new Date().toISOString().slice(0, 10),
                data.note,
                data.created_by || 'admin'
            ], function (err) {
                if (err) return callback(err);
                callback(null, this.lastID); // Pass lastID to callback
            });
        });
    },

    getByDateRange: (startDate, endDate, callback) => {
        const sql = `SELECT * FROM transactions WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC`;
        db.all(sql, [startDate, endDate], callback);
    },

    getAll: (callback) => {
        db.all("SELECT * FROM transactions ORDER BY created_at DESC", [], callback);
    },

    getByCode: (code, callback) => {
        db.get("SELECT * FROM transactions WHERE code = ?", [code], callback);
    },

    toggleHide: (id, callback) => {
        db.get("SELECT is_hidden FROM transactions WHERE id = ?", [id], (err, row) => {
            if (err) return callback(err);
            const newStatus = row.is_hidden ? 0 : 1;
            db.run("UPDATE transactions SET is_hidden = ? WHERE id = ?", [newStatus, id], callback);
        });
    },

    delete: (id, callback) => {
        db.run("DELETE FROM transactions WHERE id = ?", [id], callback);
    }
};

module.exports = Transaction;
