const Customer = require('../models/customerModel');
const { formatCreatedBy } = require('../utils/userHelper');

const customerController = {
    index: (req, res) => {
        Customer.getAll((err, customers) => {
            if (err) return res.status(500).send(err.message);
            res.render('customers/index', {
                title: 'Quản lý khách hàng',
                customers,
                active: 'customers'
            });
        });
    },

    createForm: (req, res) => {
        res.render('customers/add', {
            title: 'Thêm khách hàng',
            active: 'customers'
        });
    },

    store: (req, res) => {
        const { name, phone } = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        req.body.created_by = createdBy;
        if (!name || !phone) {
            return res.render('customers/add', {
                error: 'Vui lòng nhập tên và số điện thoại',
                data: req.body,
                active: 'customers'
            });
        }

        Customer.create(req.body, (err) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (req.headers['content-type'] === 'application/json') {
                        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
                    }
                    return res.render('customers/add', {
                        error: 'Số điện thoại đã tồn tại',
                        data: req.body,
                        active: 'customers'
                    });
                }
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(500).json({ error: err.message });
                }
                return res.status(500).send(err.message);
            }
            if (req.headers['content-type'] === 'application/json') {
                return res.status(200).json({ success: true });
            }
            res.redirect('/customers');
        });
    },

    editForm: (req, res) => {
        const phone = req.params.phone;
        Customer.getByPhone(phone, (err, customer) => {
            if (err || !customer) return res.redirect('/customers');
            res.render('customers/edit', {
                title: 'Sửa thông tin khách hàng',
                customer,
                active: 'customers'
            });
        });
    },

    update: (req, res) => {
        const phone = req.params.phone;
        Customer.update(phone, req.body, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/customers');
        });
    },

    show: (req, res) => {
        const phone = req.params.phone;
        Customer.getByPhone(phone, (err, customer) => {
            if (err || !customer) return res.redirect('/customers');

            Customer.getTransactionHistory(customer.id, (err, transactions) => {
                if (err) return res.status(500).send(err.message);
                res.render('customers/show', {
                    title: 'Chi tiết khách hàng',
                    customer,
                    transactions,
                    active: 'customers'
                });
            });
        });
    },

    apiSearch: (req, res) => {
        const query = req.query.q || '';
        Customer.search(query, (err, customers) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(customers);
        });
    }
};

module.exports = customerController;
