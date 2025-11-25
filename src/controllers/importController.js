const Import = require('../models/importModel');
const Product = require('../models/productModel');
const { formatCreatedBy } = require('../utils/userHelper');

const importController = {
    index: (req, res) => {
        Import.getAll((err, imports) => {
            if (err) return res.status(500).send(err.message);
            res.render('imports/index', {
                title: 'Lịch sử nhập hàng',
                imports,
                active: 'imports'
            });
        });
    },

    createForm: (req, res) => {
        Product.getAll((err, products) => {
            if (err) return res.status(500).send(err.message);
            res.render('imports/create', {
                title: 'Nhập hàng mới',
                products,
                active: 'imports'
            });
        });
    },

    store: (req, res) => {
        // req.body should contain items array and total_cost
        // But from HTML form, we might get arrays of fields
        // We need to parse it.
        // Expected body: { product_code: [], product_name: [], quantity: [], import_price: [] }

        const body = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        const items = [];
        let total_cost = 0;

        const extractCode = (input) => {
            if (!input) return '';
            const parts = input.split(' - ');
            return parts.length > 1 ? parts[parts.length - 1] : input;
        };

        if (Array.isArray(body.product_code)) {
            for (let i = 0; i < body.product_code.length; i++) {
                if (body.product_code[i] && body.quantity[i]) {
                    const qty = parseInt(body.quantity[i]);
                    const price = parseFloat((body.import_price[i] || '0').replace(/,/g, ''));
                    items.push({
                        product_code: extractCode(body.product_code[i]),
                        product_name: body.product_name[i],
                        quantity: qty,
                        import_price: price
                    });
                    total_cost += qty * price;
                }
            }
        } else if (body.product_code) {
            // Single item
            const qty = parseInt(body.quantity);
            const price = parseFloat((body.import_price || '0').replace(/,/g, ''));
            items.push({
                product_code: extractCode(body.product_code),
                product_name: body.product_name,
                quantity: qty,
                import_price: price
            });
            total_cost += qty * price;
        }

        if (items.length === 0) {
            return res.redirect('/imports/create');
        }

        Import.create({ items, total_cost, payment_method: body.payment_method, created_by: createdBy }, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/imports');
        });
    },

    show: (req, res) => {
        const id = req.params.id;
        Import.getById(id, (err, importData) => {
            if (err) return res.status(500).send(err.message);
            res.render('imports/show', {
                title: 'Chi tiết phiếu nhập #' + id,
                import: importData,
                active: 'imports'
            });
        });
    },

    showByCode: (req, res) => {
        const code = req.params.code;
        Import.getByCode(code, (err, importData) => {
            if (err) return res.status(500).send(err.message);
            if (!importData) return res.status(404).send('Không tìm thấy phiếu nhập');
            res.render('imports/show', {
                title: 'Chi tiết phiếu nhập ' + code,
                import: importData,
                active: 'imports'
            });
        });
    }
};

module.exports = importController;
