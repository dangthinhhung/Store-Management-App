const db = require('../config/database');

const User = {
    getAll: (callback) => {
        db.all("SELECT * FROM users ORDER BY username ASC", [], callback);
    },

    getById: (id, callback) => {
        db.get("SELECT * FROM users WHERE id = ?", [id], callback);
    },

    create: (data, callback) => {
        const sql = `INSERT INTO users (username, password, plain_password, full_name, role, phone, dob, default_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [
            data.username,
            data.password,
            data.plain_password,
            data.full_name,
            data.role,
            data.phone,
            data.dob,
            data.default_salary || 5000000
        ], callback);
    },

    update: (id, data, callback) => {
        const sql = `UPDATE users SET full_name = ?, phone = ?, dob = ?, default_salary = ? WHERE id = ?`;
        db.run(sql, [
            data.full_name,
            data.phone,
            data.dob,
            data.default_salary,
            id
        ], callback);
    },

    updatePassword: (id, password, plain_password, callback) => {
        const sql = `UPDATE users SET password = ?, plain_password = ? WHERE id = ?`;
        db.run(sql, [password, plain_password, id], callback);
    },

    delete: (id, callback) => {
        db.run("DELETE FROM users WHERE id = ?", [id], callback);
    },

    // Salary related methods
    // Salary related methods
    createSalarySlip: (data, callback) => {
        const code = `LUONG${data.month.toString().padStart(2, '0')}${data.year}`;
        const sql = `INSERT INTO salary_slips (code, month, year, total_amount, note, payment_method, created_by, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
        db.run(sql, [
            code,
            data.month,
            data.year,
            data.total_amount,
            data.note,
            data.payment_method,
            data.created_by || 'admin'
        ], function (err) {
            if (err) return callback(err);
            callback(null, this.lastID);
        });
    },

    getSalarySlipByMonthYear: (month, year, callback) => {
        db.get("SELECT * FROM salary_slips WHERE month = ? AND year = ?", [month, year], callback);
    },

    getSalarySlipByCode: (code, callback) => {
        db.get("SELECT * FROM salary_slips WHERE code = ?", [code], callback);
    },

    getSalarySlipById: (id, callback) => {
        db.get("SELECT * FROM salary_slips WHERE id = ?", [id], callback);
    },

    getAllSalarySlips: (callback) => {
        db.all("SELECT * FROM salary_slips ORDER BY year DESC, month DESC", [], callback);
    },

    addSalary: (data, callback) => {
        const sql = `INSERT INTO salaries (user_id, amount, month, year, bonus, penalty, payment_method, payment_date, salary_slip_id) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')), ?)`;
        db.run(sql, [
            data.user_id,
            data.amount,
            data.month,
            data.year,
            data.bonus || 0,
            data.penalty || 0,
            data.payment_method || 'Chuyển khoản',
            data.payment_date,
            data.salary_slip_id
        ], callback);
    },

    getSalariesBySlipId: (slipId, callback) => {
        db.all(`
            SELECT s.*, u.full_name, u.default_salary as base_salary
            FROM salaries s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.salary_slip_id = ?`,
            [slipId], callback
        );
    },

    deleteSalariesBySlipId: (slipId, callback) => {
        db.run("DELETE FROM salaries WHERE salary_slip_id = ?", [slipId], callback);
    },

    updateSalarySlip: (id, data, callback) => {
        const sql = `UPDATE salary_slips SET total_amount = ?, note = ?, payment_method = ? WHERE id = ?`;
        db.run(sql, [data.total_amount, data.note, data.payment_method, id], callback);
    },

    getSalaries: (callback) => {
        // Kept for backward compatibility if needed, but we should use Slips now
        db.all(`
            SELECT s.*, u.full_name 
            FROM salaries s 
            JOIN users u ON s.user_id = u.id 
            ORDER BY s.year DESC, s.month DESC`,
        );
    },

    deleteSalary: (id, callback) => {
        // Delete the salary slip (cascading will handle salaries table if needed)
        db.run("DELETE FROM salary_slips WHERE id = ?", [id], callback);
    },

    toggleHideSalary: (id, callback) => {
        db.get("SELECT is_hidden FROM salary_slips WHERE id = ?", [id], (err, row) => {
            if (err) return callback(err);
            const newStatus = row.is_hidden ? 0 : 1;
            db.run("UPDATE salary_slips SET is_hidden = ? WHERE id = ?", [newStatus, id], callback);
        });
    },

    getSalarySlipById: (id, callback) => {
        db.get(`
            SELECT ss.*, GROUP_CONCAT(DISTINCT u.full_name) as full_name, GROUP_CONCAT(DISTINCT u.phone) as phone
            FROM salary_slips ss
            LEFT JOIN salaries s ON ss.id = s.salary_slip_id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE ss.id = ?
            GROUP BY ss.id`,
            [id], callback
        );
    }
};

module.exports = User;
