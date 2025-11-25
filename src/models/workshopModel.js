const db = require('../config/database');

const Workshop = {
    getAll: (callback) => {
        const sql = `
            SELECT w.*, c.name as customer_name 
            FROM workshop_orders w
            LEFT JOIN customers c ON w.customer_phone = c.phone
            ORDER BY w.created_at DESC
        `;
        db.all(sql, [], callback);
    },

    getById: (id, callback) => {
        const sql = `
            SELECT w.*, c.name as customer_name 
            FROM workshop_orders w
            LEFT JOIN customers c ON w.customer_phone = c.phone
            WHERE w.id = ?
        `;
        db.get(sql, [id], (err, order) => {
            if (err) return callback(err);
            if (!order) return callback(null, null);

            db.all("SELECT * FROM workshop_items WHERE workshop_order_id = ?", [id], (err, items) => {
                if (err) return callback(err);
                order.items = items;

                // Get payment history
                db.all("SELECT * FROM workshop_payments WHERE workshop_order_id = ? ORDER BY created_at DESC", [id], (err, payments) => {
                    if (err) return callback(err);
                    order.payments = payments;
                    callback(null, order);
                });
            });
        });
    },

    getByCode: (code, callback) => {
        const sql = `
            SELECT w.*, c.name as customer_name 
            FROM workshop_orders w
            LEFT JOIN customers c ON w.customer_phone = c.phone
            WHERE w.code = ?
        `;
        db.get(sql, [code], (err, order) => {
            if (err) return callback(err);
            if (!order) return callback(null, null);

            db.all("SELECT * FROM workshop_items WHERE workshop_order_id = ?", [order.id], (err, items) => {
                if (err) return callback(err);
                order.items = items;

                // Get payment history
                db.all("SELECT * FROM workshop_payments WHERE workshop_order_id = ? ORDER BY created_at DESC", [order.id], (err, payments) => {
                    if (err) return callback(err);
                    order.payments = payments;
                    callback(null, order);
                });
            });
        });
    },

    create: (data, callback) => {
        // data.items = [{device_type, device_code, quantity, unit_repair_price, issue_description}]
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Generate workshop code: SC + 6 digits
            db.get("SELECT COUNT(*) as count FROM workshop_orders", [], (err, row) => {
                if (err) {
                    db.run("ROLLBACK");
                    return callback(err);
                }

                const nextNumber = (row.count + 1).toString().padStart(6, '0');
                const code = 'SC' + nextNumber;

                db.run(`INSERT INTO workshop_orders (customer_phone, code, total_cost, total_paid, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
                    [data.customer_phone, code, data.total_cost, data.total_paid, 'IN_REPAIR', data.created_by || 'admin'],
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
                            db.run(`INSERT INTO workshop_items (workshop_order_id, device_type, device_code, issue_description, repair_price, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
                                [orderId, item.device_type, item.device_code, item.issue_description, item.unit_repair_price, item.quantity],
                                checkDone
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

    addPayment: (id, amount, note, paymentMethod, createdBy, callback) => {
        db.run("INSERT INTO workshop_payments (workshop_order_id, amount, note, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))", [id, amount, note, paymentMethod, createdBy || 'admin'], (err) => {
            if (err) return callback(err);

            // Update total_paid
            db.run("UPDATE workshop_orders SET total_paid = total_paid + ? WHERE id = ?", [amount, id], (err) => {
                if (err) return callback(err);

                // Check if fully paid and update status
                db.get("SELECT total_cost, total_paid, status FROM workshop_orders WHERE id = ?", [id], (err, order) => {
                    if (err) return callback(err);

                    // Only automatically set to PAID when fully paid
                    if (order.total_paid >= order.total_cost) {
                        db.run("UPDATE workshop_orders SET status = ? WHERE id = ?", ['PAID', id], callback);
                    } else {
                        // Keep current status if not fully paid
                        callback();
                    }
                });
            });
        });
    },

    updateStatus: (id, status, callback) => {
    },

    deletePayment: (id, callback) => {
        db.run("DELETE FROM workshop_payments WHERE id = ?", [id], callback);
    },

    toggleHidePayment: (id, callback) => {
        db.get("SELECT is_hidden FROM workshop_payments WHERE id = ?", [id], (err, row) => {
            if (err) return callback(err);
            if (!row) return callback(new Error('Payment not found'));
            const newStatus = row.is_hidden ? 0 : 1;
            db.run("UPDATE workshop_payments SET is_hidden = ? WHERE id = ?", [newStatus, id], callback);
        });
    }
};

module.exports = Workshop;
