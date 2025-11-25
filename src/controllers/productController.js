const Product = require('../models/productModel');
const { formatCreatedBy } = require('../utils/userHelper');

const productController = {
    index: (req, res) => {
        Product.getAll((err, products) => {
            if (err) return res.status(500).send(err.message);
            res.render('products/index', {
                title: 'Quản lý sản phẩm',
                products,
                active: 'products'
            });
        });
    },

    createForm: (req, res) => {
        res.render('products/add', {
            title: 'Thêm sản phẩm mới',
            active: 'products'
        });
    },

    store: (req, res) => {
        const { product_code, name, default_selling_price, unit } = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        req.body.created_by = createdBy;
        // Basic validation
        if (!product_code || !name || !default_selling_price) {
            return res.render('products/add', {
                error: 'Vui lòng điền đầy đủ thông tin',
                title: 'Thêm sản phẩm mới',
                active: 'products',
                data: req.body
            });
        }

        Product.create(req.body, (err) => {
            if (err) {
                return res.render('products/add', {
                    error: 'Lỗi: ' + err.message,
                    title: 'Thêm sản phẩm mới',
                    active: 'products',
                    data: req.body
                });
            }
            res.redirect('/products');
        });
    },

    editForm: (req, res) => {
        const code = req.params.code;
        Product.getByCode(code, (err, product) => {
            if (err || !product) return res.redirect('/products');

            // Get import and sales history
            Product.getImportHistory(code, (err, importHistory) => {
                Product.getSalesHistory(code, (err, salesHistory) => {
                    res.render('products/edit', {
                        title: 'Sửa sản phẩm',
                        product,
                        importHistory: importHistory || [],
                        salesHistory: salesHistory || [],
                        active: 'products'
                    });
                });
            });
        });
    },

    update: (req, res) => {
        const code = req.params.code;
        Product.update(code, req.body, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/products');
        });
    },

    apiSearch: (req, res) => {
        const query = req.query.q || '';
        Product.search(query, (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(products);
        });
    }
};

module.exports = productController;
