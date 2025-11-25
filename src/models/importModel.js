const db = require('../config/database');

const Import = {
    getAll: (callback) => {
        db.all("SELECT * FROM imports ORDER BY created_at DESC", [], callback);
    },

    getById: (id, callback) => {
        db.get("SELECT * FROM imports WHERE id = ?", [id], (err, importData) => {
            if (err || !importData) return callback(err, null);

            db.all(`
                SELECT ii.*, p.name as product_name 
                FROM import_items ii 
                JOIN products p ON ii.product_code = p.product_code 
                WHERE ii.import_id = ?`,
                [id],
                (err, items) => {
                    if (err) return callback(err, null);
                    importData.items = items;
                    callback(null, importData);
                }
            );
        });
    },

    getByCode: (code, callback) => {
        db.get("SELECT * FROM imports WHERE code = ?", [code], (err, importData) => {
            if (err || !importData) return callback(err, null);

            db.all(`
                SELECT ii.*, p.name as product_name 
                FROM import_items ii 
                JOIN products p ON ii.product_code = p.product_code 
                WHERE ii.import_id = ?`,
                [importData.id],
                (err, items) => {
                    if (err) return callback(err, null);
                    importData.items = items;
                    callback(null, importData);
                }
            );
        });
    },

    create: (data, callback) => {
        // data.items = [{product_code, quantity, import_price, product_name}]
        // Transaction
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Generate import code: NHAP + 6 digits
            db.get("SELECT COUNT(*) as count FROM imports", [], (err, row) => {
                if (err) {
                    db.run("ROLLBACK");
                    return callback(err);
                }

                const nextNumber = (row.count + 1).toString().padStart(6, '0');
                const code = 'NHAP' + nextNumber;

                db.run("INSERT INTO imports (code, total_cost, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))",
                    [code, data.total_cost, data.payment_method || 'Chuyển khoản', data.created_by || 'admin'],
                    function (err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return callback(err);
                        }
                        const importId = this.lastID;
                        const items = data.items;
                        let completed = 0;

                        if (items.length === 0) {
                            db.run("COMMIT");
                            return callback(null, importId);
                        }

                        items.forEach(item => {
                            // Insert item
                            db.run(`INSERT INTO import_items (import_id, product_code, quantity, import_price) VALUES (?, ?, ?, ?)`,
                                [importId, item.product_code, item.quantity, item.import_price],
                                (err) => {
                                    if (err) {
                                        db.run("ROLLBACK");
                                        return callback(err);
                                    }

                                    // Check if product exists
                                    db.get("SELECT * FROM products WHERE product_code = ?", [item.product_code], (err, product) => {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            return callback(err);
                                        }

                                        if (product) {
                                            // Update existing
                                            const newStock = product.stock_quantity + parseInt(item.quantity);
                                            db.run("UPDATE products SET stock_quantity = ?, import_price = ? WHERE product_code = ?",
                                                [newStock, item.import_price, item.product_code],
                                                checkDone
                                            );
                                        } else {
                                            // Create new product
                                            const name = item.product_name || 'New Product';
                                            const defaultPrice = item.import_price * 1.2; // Default markup
                                            db.run(`INSERT INTO products (product_code, name, default_selling_price, unit, stock_quantity, import_price) VALUES (?, ?, ?, ?, ?, ?)`,
                                                [item.product_code, name, defaultPrice, 'Cái', item.quantity, item.import_price],
                                                checkDone
                                            );
                                        }
                                    });
                                }
                            );
                        });

                        function checkDone(err) {
                            if (err) {
                                db.run("ROLLBACK");
                                return callback(err);
                            }
                            completed++;
                            if (completed === items.length) {
                                // All items processed, now create expense transaction
                                const description = `Nhập hàng - Phiếu ${code}`;
                                db.run(
                                    `INSERT INTO transactions (type, amount, description, payment_method, created_at) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
                                    ['EXPENSE', data.total_cost, description, data.payment_method || 'Chuyển khoản'],
                                    (err) => {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            return callback(err);
                                        }
                                        db.run("COMMIT");
                                        callback(null, importId);
                                    }
                                );
                            }
                        }
                    }
                );
            });
        });
    }
};

module.exports = Import;
