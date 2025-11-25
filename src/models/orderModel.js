const db = require('../config/database');

const Order = {
    getAll: (callback) => {
        db.all("SELECT * FROM orders ORDER BY created_at DESC", [], callback);
    },

    getById: (id, callback) => {
        const sql = `
            SELECT o.*, c.name as customer_name 
            FROM orders o
            LEFT JOIN customers c ON o.customer_phone = c.phone
            WHERE o.id = ?
        `;
        db.get(sql, [id], (err, order) => {
            if (err) return callback(err);
            if (!order) return callback(null, null);

            // Join with products to get product_name and product_code
            db.all(`
                SELECT oi.*, p.name as product_name, p.product_code 
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [id], (err, items) => {
                if (err) return callback(err);
                order.items = items;
                callback(null, order);
            });
        });
    },

    getByCode: (code, callback) => {
        const sql = `
            SELECT o.*, c.name as customer_name 
            FROM orders o
            LEFT JOIN customers c ON o.customer_phone = c.phone
            WHERE o.code = ?
        `;
        db.get(sql, [code], (err, order) => {
            if (err) return callback(err);
            if (!order) return callback(null, null);

            // Join with products to get product_name and product_code
            db.all(`
                SELECT oi.*, p.name as product_name, p.product_code 
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id], (err, items) => {
                if (err) return callback(err);
                order.items = items;
                callback(null, order);
            });
        });
    },

    create: (data, callback) => {
        // data.items = [{product_id, quantity, price}]
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Generate order code: DH + 6 digits
            db.get("SELECT COUNT(*) as count FROM orders", [], (err, row) => {
                if (err) {
                    db.run("ROLLBACK");
                    return callback(err);
                }

                const nextNumber = (row.count + 1).toString().padStart(6, '0');
                const code = 'DH' + nextNumber;

                db.run(`INSERT INTO orders (customer_phone, code, total_amount, discount, final_amount, status, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
                    [data.customer_phone, code, data.total_amount, data.discount, data.final_amount, 'PAID', data.payment_method || 'Tiền mặt', data.created_by || 'admin'],
                    function (err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return callback(err);
                        }
                        const orderId = this.lastID;
                        const items = data.items;
                        let completed = 0;

                        if (items.length === 0) {
                            db.run("COMMIT");
                            return callback(null, orderId);
                        }

                        items.forEach(item => {
                            db.run(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                                [orderId, item.product_id, item.quantity, item.price],
                                (err) => {
                                    if (err) {
                                        db.run("ROLLBACK");
                                        return callback(err);
                                    }

                                    // Deduct stock
                                    db.run(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
                                        [item.quantity, item.product_id],
                                        checkDone
                                    );
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
                                db.run("COMMIT");
                                callback(null, orderId);
                            }
                        }
                    }
                );
            });
        });
    },

    deleteOrder: (id, callback) => {
        db.run("DELETE FROM orders WHERE id = ?", [id], callback);
    },

    toggleHide: (id, callback) => {
        db.get("SELECT is_hidden FROM orders WHERE id = ?", [id], (err, row) => {
            if (err) return callback(err);
            const newStatus = row.is_hidden ? 0 : 1;
            db.run("UPDATE orders SET is_hidden = ? WHERE id = ?", [newStatus, id], callback);
        });
    }
};

module.exports = Order;
