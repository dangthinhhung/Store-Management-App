const Workshop = require('../models/workshopModel');
const { formatCreatedBy } = require('../utils/userHelper');
// Need Customer model later

const workshopController = {
    index: (req, res) => {
        Workshop.getAll((err, orders) => {
            if (err) return res.status(500).send(err.message);

            // Calculate remaining
            orders.forEach(o => {
                o.remaining = o.total_cost - o.total_paid;
            });

            res.render('workshop/index', {
                title: 'Quản lý xưởng sửa chữa',
                orders,
                active: 'workshop'
            });
        });
    },

    createForm: (req, res) => {
        const Customer = require('../models/customerModel');
        Customer.getAll((err, customers) => {
            if (err) return res.status(500).send(err.message);
            res.render('workshop/create', {
                title: 'Tiếp nhận sửa chữa',
                customers,
                active: 'workshop'
            });
        });
    },

    store: (req, res) => {
        const body = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        const items = [];

        if (Array.isArray(body.device_type)) {
            for (let i = 0; i < body.device_type.length; i++) {
                if (body.device_type[i]) {
                    items.push({
                        device_type: body.device_type[i],
                        device_code: body.device_code[i],
                        quantity: parseInt(body.quantity[i]),
                        unit_repair_price: parseFloat((body.unit_repair_price[i] || '0').replace(/,/g, '')),
                        issue_description: body.issue_description[i]
                    });
                }
            }
        } else if (body.device_type) {
            items.push({
                device_type: body.device_type,
                device_code: body.device_code,
                quantity: parseInt(body.quantity),
                unit_repair_price: parseFloat((body.unit_repair_price || '0').replace(/,/g, '')),
                issue_description: body.issue_description
            });
        }

        const orderData = {
            customer_phone: body.customer_phone || null,
            total_cost: items.reduce((sum, item) => sum + (item.quantity * item.unit_repair_price), 0), // Auto calc total cost
            total_paid: 0,
            items,
            created_by: createdBy
        };

        Workshop.create(orderData, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/workshop');
        });
    },

    show: (req, res) => {
        const id = req.params.id;
        Workshop.getById(id, (err, order) => {
            if (err) return res.status(500).send(err.message);

            // Calculate remaining
            order.remaining = order.total_cost - order.total_paid;

            res.render('workshop/show', {
                title: 'Chi tiết phiếu sửa chữa #' + id,
                order,
                active: 'workshop'
            });
        });
    },

    showByCode: (req, res) => {
        const code = req.params.code;
        Workshop.getByCode(code, (err, order) => {
            if (err) return res.status(500).send(err.message);
            if (!order) return res.status(404).send('Không tìm thấy phiếu sửa chữa');

            // Calculate remaining
            order.remaining = order.total_cost - order.total_paid;

            res.render('workshop/show', {
                title: 'Chi tiết phiếu sửa chữa ' + code,
                order,
                active: 'workshop'
            });
        });
    },

    addPayment: (req, res) => {
        const id = req.params.id;
        const amount = parseFloat((req.body.amount || '0').replace(/,/g, ''));
        const note = req.body.note || '';
        const paymentMethod = req.body.payment_method || 'Chuyển khoản';
        const createdBy = formatCreatedBy(req.session.user);

        Workshop.addPayment(id, amount, note, paymentMethod, createdBy, (err) => {
            if (err) return res.status(500).send(err.message);

            // Get workshop order to find customer
            const db = require('../config/database');
            db.get('SELECT customer_phone FROM workshop_orders WHERE id = ?', [id], (err, order) => {
                if (order && order.customer_phone) {
                    // Get customer id from phone
                    db.get('SELECT id FROM customers WHERE phone = ?', [order.customer_phone], (err, customer) => {
                        if (customer) {
                            // Get the payment id (last inserted)
                            db.get('SELECT id FROM workshop_payments WHERE workshop_order_id = ? ORDER BY created_at DESC LIMIT 1', [id], (err, payment) => {
                                if (payment) {
                                    const customerTxSql = `INSERT INTO customer_transactions (customer_id, transaction_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
                                    db.run(customerTxSql, [
                                        customer.id,
                                        id, // workshop_order_id
                                        'WORKSHOP',
                                        amount,
                                        `Thanh toán xưởng #${id}`
                                    ], (err) => {
                                        if (err) console.error('Error saving customer transaction:', err.message);
                                        res.redirect('/workshop/' + id);
                                    });
                                } else {
                                    res.redirect('/workshop/' + id);
                                }
                            });
                        } else {
                            res.redirect('/workshop/' + id);
                        }
                    });
                } else {
                    res.redirect('/workshop/' + id);
                }
            });
        });
    },

    updateStatus: (req, res) => {
        const id = req.params.id;
        const status = req.body.status;
        Workshop.updateStatus(id, status, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/workshop/' + id);
        });
    }
};

module.exports = workshopController;
