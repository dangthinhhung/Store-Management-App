const db = require('../config/database');

const Product = {
    getAll: (callback) => {
        db.all("SELECT * FROM products ORDER BY name ASC", [], callback);
    },

    getByCode: (code, callback) => {
        db.get("SELECT * FROM products WHERE product_code = ?", [code], callback);
    },

    getById: (id, callback) => {
        db.get("SELECT * FROM products WHERE id = ?", [id], callback);
    },

    create: (data, callback) => {
        const searchStr = require('../utils/stringUtils').removeAccents(data.name + ' ' + data.product_code).toLowerCase();
        const sql = `INSERT INTO products (product_code, name, default_selling_price, unit, stock_quantity, is_active, search_string, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [
            data.product_code,
            data.name,
            data.default_selling_price,
            data.unit,
            data.stock_quantity,
            data.is_active,
            searchStr,
            data.created_by || 'admin'
        ], callback);
    },

    update: (id, data, callback) => {
        const searchStr = require('../utils/stringUtils').removeAccents(data.name).toLowerCase();

        // Stock quantity should NOT be updated from the edit form
        // It should only change through imports and sales
        const sql = `UPDATE products SET name = ?, default_selling_price = ?, unit = ?, is_active = ?, search_string = ? WHERE product_code = ?`;

        db.run(sql, [
            data.name,
            data.default_selling_price,
            data.unit,
            data.is_active,
            searchStr,
            id
        ], callback);
    },

    search: (query, callback) => {
        const normalizedQuery = require('../utils/stringUtils').removeAccents(query).toLowerCase();
        const sql = "SELECT * FROM products WHERE search_string LIKE ? AND is_active = 1 LIMIT 20";
        const params = [`%${normalizedQuery}%`];
        db.all(sql, params, callback);
    },

    getImportHistory: (code, callback) => {
        const sql = `
            SELECT i.created_at, ii.quantity, ii.import_price 
            FROM import_items ii 
            JOIN imports i ON ii.import_id = i.id 
            WHERE ii.product_code = ? 
            ORDER BY i.created_at DESC`;
        db.all(sql, [code], callback);
    },

    getSalesHistory: (code, callback) => {
        const sql = `
            SELECT o.created_at, oi.quantity, oi.price 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            JOIN products p ON oi.product_id = p.id
            WHERE p.product_code = ? 
            ORDER BY o.created_at DESC`;
        db.all(sql, [code], callback);
    }
};

module.exports = Product;
