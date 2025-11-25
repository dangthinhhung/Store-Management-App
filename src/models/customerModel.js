const db = require('../config/database');

const Customer = {
    getAll: (callback) => {
        db.all("SELECT * FROM customers ORDER BY name ASC", [], callback);
    },

    getByPhone: (phone, callback) => {
        db.get("SELECT * FROM customers WHERE phone = ?", [phone], callback);
    },

    create: (data, callback) => {
        const searchStr = require('../utils/stringUtils').removeAccents(data.name + ' ' + data.phone).toLowerCase();

        // Generate customer code: KH + 6 digits
        db.get("SELECT COUNT(*) as count FROM customers", [], (err, row) => {
            if (err) return callback(err);

            const nextNumber = (row.count + 1).toString().padStart(6, '0');
            const code = 'KH' + nextNumber;

            const sql = `INSERT INTO customers (phone, code, name, address, note, search_string, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql, [
                data.phone,
                code,
                data.name,
                data.address,
                data.note,
                searchStr,
                data.created_by || 'admin'
            ], callback);
        });
    },

    update: (phone, data, callback) => {
        const searchStr = require('../utils/stringUtils').removeAccents(data.name + ' ' + phone).toLowerCase();
        const sql = `UPDATE customers SET name = ?, address = ?, note = ?, search_string = ? WHERE phone = ?`;
        db.run(sql, [
            data.name,
            data.address,
            data.note,
            searchStr,
            phone
        ], callback);
    },

    search: (query, callback) => {
        const normalizedQuery = require('../utils/stringUtils').removeAccents(query).toLowerCase();
        const sql = "SELECT * FROM customers WHERE search_string LIKE ? LIMIT 20";
        const params = [`%${normalizedQuery}%`];
        db.all(sql, params, callback);
    },

    getPurchaseHistory: (phone, callback) => {
        db.all("SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC", [phone], callback);
    },

    getTransactionHistory: (customerId, callback) => {
        const sql = `
            SELECT 
                ct.*,
                o.id as order_id,
                w.id as workshop_id
            FROM customer_transactions ct
            LEFT JOIN orders o ON ct.transaction_id = o.id AND ct.type = 'ORDER'
            LEFT JOIN workshop_orders w ON ct.transaction_id = w.id AND ct.type = 'WORKSHOP'
            WHERE ct.customer_id = ?
            ORDER BY ct.created_at DESC
        `;
        db.all(sql, [customerId], callback);
    }
};

module.exports = Customer;
