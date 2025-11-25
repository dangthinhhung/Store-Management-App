const db = require('../config/database');
const Transaction = require('../models/transactionModel');
const { formatCreatedBy } = require('../utils/userHelper');
// We need to require Order and Workshop models or query directly.
// Since we need specific date filtering, querying directly might be easier or adding methods to models.
// Let's query directly for simplicity in controller or use Promise wrappers.

const reportController = {
    index: (req, res) => {
        const type = req.query.type || 'daily'; // daily, monthly, yearly

        // Helper to get local date string YYYY-MM-DD
        const getLocalDate = () => {
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            return new Date(now.getTime() - offset).toISOString().slice(0, 10);
        };

        const date = req.query.date || getLocalDate();
        const month = req.query.month || getLocalDate().slice(0, 7);
        const year = req.query.year || new Date().getFullYear().toString();

        let startDate, endDate;

        if (type === 'daily') {
            startDate = date + ' 00:00:00';
            // Next day
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            endDate = d.toISOString().slice(0, 10) + ' 00:00:00';
        } else if (type === 'monthly') {
            startDate = month + '-01 00:00:00';
            // Next month
            const [y, m] = month.split('-');
            const d = new Date(y, m, 1); // Month is 0-indexed in JS Date but we passed 1-12? Wait. 
            // month input is YYYY-MM. 
            // new Date(2023, 11, 1) is Dec 1st. new Date(2023, 12, 1) is Jan 1st next year.
            // So we can just use the next month index.
            // Actually simpler:
            const nextMonthDate = new Date(parseInt(y), parseInt(m), 1);
            endDate = nextMonthDate.toISOString().slice(0, 10) + ' 00:00:00';
        } else if (type === 'yearly') {
            startDate = year + '-01-01 00:00:00';
            endDate = (parseInt(year) + 1) + '-01-01 00:00:00';
        }

        const queries = {
            orders: new Promise((resolve, reject) => {
                db.all("SELECT * FROM orders WHERE created_at >= ? AND created_at < ?", [startDate, endDate], (err, rows) => {
                    if (err) reject(err); else resolve(rows);
                });
            }),
            transactions: new Promise((resolve, reject) => {
                // Transaction.getByDateRange uses BETWEEN, we should query directly or update model.
                // Let's query directly for consistency here.
                db.all("SELECT * FROM transactions WHERE created_at >= ? AND created_at < ?", [startDate, endDate], (err, rows) => {
                    if (err) reject(err); else resolve(rows);
                });
            }),
            workshop: new Promise((resolve, reject) => {
                db.all(`
                    SELECT wp.*, wo.code 
                    FROM workshop_payments wp
                    JOIN workshop_orders wo ON wp.workshop_order_id = wo.id
                    WHERE wp.created_at >= ? AND wp.created_at < ?
                `, [startDate, endDate], (err, rows) => {
                    if (err) {
                        resolve([]);
                    } else resolve(rows);
                });
            }),
            salarySlips: new Promise((resolve, reject) => {
                db.all(`
                    SELECT ss.*, GROUP_CONCAT(DISTINCT u.full_name) as full_name
                    FROM salary_slips ss
                    LEFT JOIN salaries s ON ss.id = s.salary_slip_id
                    LEFT JOIN users u ON s.user_id = u.id
                    WHERE ss.payment_date >= ? AND ss.payment_date < ?
                    GROUP BY ss.id
                `, [startDate, endDate], (err, rows) => {
                    if (err) resolve([]); else resolve(rows);
                });
            })
        };

        Promise.all([queries.orders, queries.transactions, queries.workshop, queries.salarySlips])
            .then(([orders, transactions, workshopPayments, salarySlips]) => {
                let revenue = 0;
                let expense = 0;
                let revenueCash = 0;
                let revenueTransfer = 0;
                let expenseCash = 0;
                let expenseTransfer = 0;

                // Retail Revenue
                orders.forEach(o => {
                    if (o.is_hidden) return;
                    if (o.status === 'PAID') {
                        revenue += o.final_amount;
                        if (o.payment_method === 'Tiền mặt') revenueCash += o.final_amount;
                        else revenueTransfer += o.final_amount;
                    }
                });

                // Workshop Revenue
                workshopPayments.forEach(p => {
                    if (p.is_hidden) return;
                    revenue += p.amount;
                    if (p.payment_method === 'Tiền mặt') revenueCash += p.amount;
                    else revenueTransfer += p.amount;
                });

                // Custom Transactions
                transactions.forEach(t => {
                    if (t.is_hidden) return; // Skip hidden transactions from totals

                    const type = (t.type || '').trim().toUpperCase();
                    const amount = parseFloat(t.amount) || 0;
                    if (type === 'INCOME') {
                        revenue += amount;
                        if (t.payment_method === 'Tiền mặt') revenueCash += amount;
                        else revenueTransfer += amount;
                    }
                    if (type === 'EXPENSE') {
                        expense += amount;
                        if (t.payment_method === 'Tiền mặt') expenseCash += amount;
                        else expenseTransfer += amount;
                    }
                });

                // Salary Slips
                salarySlips.forEach(s => {
                    if (s.is_hidden) return;
                    const amount = parseFloat(s.total_amount) || 0;
                    expense += amount;
                    if (s.payment_method === 'Tiền mặt') expenseCash += amount;
                    else expenseTransfer += amount;
                });

                // Calculate profit
                const profit = revenue - expense;

                const templateData = {
                    title: 'Báo cáo doanh thu',
                    active: 'reports',
                    type,
                    date,
                    month,
                    year,
                    currentDate: getLocalDate(), // For modal default
                    revenue,
                    expense,
                    profit,
                    revenueCash,
                    revenueTransfer,
                    expenseCash,
                    expenseTransfer,
                    orders,
                    transactions,
                    workshopPayments,
                    salarySlips
                };

                res.render('reports/index', templateData);
            })
            .catch(err => res.status(500).send(err.message));
    },

    toggleHideTransaction: (req, res) => {
        const id = req.params.id;
        Transaction.toggleHide(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    deleteTransaction: (req, res) => {
        const id = req.params.id;
        Transaction.delete(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    toggleHideOrder: (req, res) => {
        const id = req.params.id;
        const Order = require('../models/orderModel');
        Order.toggleHide(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    deleteOrder: (req, res) => {
        const id = req.params.id;
        const Order = require('../models/orderModel');
        Order.deleteOrder(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    toggleHideWorkshopPayment: (req, res) => {
        const id = req.params.id;
        const Workshop = require('../models/workshopModel');
        Workshop.toggleHidePayment(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    deleteWorkshopPayment: (req, res) => {
        const id = req.params.id;
        const Workshop = require('../models/workshopModel');
        Workshop.deletePayment(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    toggleHideSalary: (req, res) => {
        const id = req.params.id;
        const User = require('../models/userModel');
        User.toggleHideSalary(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    deleteSalary: (req, res) => {
        const id = req.params.id;
        const User = require('../models/userModel');
        User.deleteSalary(id, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    },

    createTransaction: (req, res) => {
        const { type, amount, transaction_name, description, payment_method, customer_id, transaction_date, note } = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        const transactionData = {
            type,
            amount: parseFloat((amount || '0').replace(/,/g, '')),
            transaction_name,
            description,
            payment_method,
            customer_id: customer_id || null,
            transaction_date,
            note,
            created_by: createdBy
        };

        Transaction.create(transactionData, function (err, transactionId) {
            if (err) return res.status(500).send(err.message);

            // If customer is selected, add to customer transaction history
            if (customer_id) {
                // transactionId is passed directly now
                const customerTransactionSql = `INSERT INTO customer_transactions (customer_id, transaction_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`;

                db.run(customerTransactionSql, [
                    customer_id,
                    transactionId,
                    type,
                    transactionData.amount,
                    transaction_name || description
                ], (err) => {
                    if (err) console.error('Error adding customer transaction:', err.message);
                    res.redirect('/reports');
                });
            } else {
                res.redirect('/reports');
            }
        });
    },

    showTransaction: (req, res) => {
        const transactionId = req.params.id;
        db.get('SELECT * FROM transactions WHERE id = ?', [transactionId], (err, transaction) => {
            if (err || !transaction) {
                return res.redirect('/reports');
            }

            // Get customer name if customer_id exists
            if (transaction.customer_id) {
                db.get('SELECT * FROM customers WHERE id = ?', [transaction.customer_id], (err, customer) => {
                    res.render('reports/transaction_detail', {
                        title: 'Chi tiết giao dịch',
                        transaction,
                        customer,
                        active: 'reports'
                    });
                });
            } else {
                res.render('reports/transaction_detail', {
                    title: 'Chi tiết giao dịch',
                    transaction,
                    active: 'reports'
                });
            }
        });
    }
};

module.exports = reportController;
