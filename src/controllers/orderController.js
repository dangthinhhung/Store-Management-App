const Order = require('../models/orderModel');
const { formatCreatedBy } = require('../utils/userHelper');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel'); // We need to create this later, but for now we can mock or just query directly if needed. 
// Actually let's create customerModel first or inline it. 
// I'll assume Customer model exists or I'll create it in next step. 
// For now, I will use a placeholder for customers.
const db = require('../config/database'); // Move db require to top

const orderController = {
    pos: (req, res) => {
        // Fetch only active products
        db.all("SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC", [], (err, products) => {
            if (err) return res.status(500).send(err.message);
            res.render('pos/index', {
                title: 'Bán hàng (POS)',
                products,
                active: 'pos'
            });
        });
    },

    history: (req, res) => {
        Order.getAll((err, orders) => {
            if (err) return res.status(500).send(err.message);
            res.render('pos/history', {
                title: 'Lịch sử đơn hàng',
                orders,
                active: 'pos'
            });
        });
    },

    store: (req, res) => {
        const body = req.body;
        const createdBy = formatCreatedBy(req.session.user);
        // REMOVED: const db = require('../config/database');

        // Debug logging
        console.log('Request body:', body);
        console.log('Request body keys:', Object.keys(body || {}));

        // Check if body exists
        if (!body) {
            return res.status(400).json({ error: 'Không nhận được dữ liệu từ form' });
        }

        // Parse items
        // Body can have: product_code[] or product_code
        const items = [];
        let total_amount = 0;

        // Check for array notation (product_code[]) or regular (product_code)
        const productCodes = body['product_code[]'] || body.product_code;
        const quantities = body['quantity[]'] || body.quantity;
        const prices = body['price[]'] || body.price;

        console.log('Product codes:', productCodes);
        console.log('Quantities:', quantities);
        console.log('Prices:', prices);

        if (Array.isArray(productCodes)) {
            for (let i = 0; i < productCodes.length; i++) {
                if (productCodes[i] && quantities[i]) {
                    const qty = parseInt(quantities[i]);
                    const price = parseFloat(prices[i]);
                    items.push({
                        product_code: productCodes[i],
                        quantity: qty,
                        price: price
                    });
                    total_amount += qty * price;
                }
            }
        } else if (productCodes) {
            const qty = parseInt(quantities);
            const price = parseFloat(prices);
            items.push({
                product_code: productCodes,
                quantity: qty,
                price: price
            });
            total_amount += qty * price;
        }

        // Validate stock for all items
        let stockErrors = [];
        let processed = 0;

        // Handle case where no items are provided
        if (items.length === 0) {
            return res.status(400).json({ error: "Không có sản phẩm nào trong đơn hàng." });
        }

        items.forEach(item => {
            db.get("SELECT id, name, stock_quantity FROM products WHERE product_code = ?", [item.product_code], (err, product) => {
                if (err || !product) {
                    stockErrors.push(`Không tìm thấy sản phẩm: ${item.product_code}`);
                } else if (product.stock_quantity < item.quantity) {
                    stockErrors.push(`Không đủ hàng trong kho cho ${product.name}. Tồn kho: ${product.stock_quantity}, Yêu cầu: ${item.quantity}`);
                } else {
                    item.product_id = product.id;
                }

                processed++;
                if (processed === items.length) {
                    if (stockErrors.length > 0) {
                        return res.status(400).json({ error: stockErrors.join('; ') });
                    }

                    // Proceed with order creation
                    const discount = parseFloat(body.discount) || 0;
                    const final_amount = total_amount - discount;

                    const customer_phone = body.customer_phone || null;
                    const payment_method = body.payment_method || 'Tiền mặt';

                    const orderData = {
                        customer_phone,
                        user_id: req.session.user ? req.session.user.id : 1,
                        total_amount,
                        discount,
                        final_amount,
                        payment_method,
                        items,
                        created_by: createdBy
                    };

                    Order.create(orderData, function (err, orderId) {
                        if (err) return res.status(500).json({ error: err.message });

                        // const orderId = this.lastID; // this.lastID is not available here because we are in a callback of Order.create, not db.run


                        // If customer selected, add to customer transaction history
                        if (body.customer_phone) {
                            const db = require('../config/database');
                            // First get customer_id from phone
                            db.get('SELECT id FROM customers WHERE phone = ?', [body.customer_phone], (err, customer) => {
                                if (customer) {
                                    const customerTxSql = `INSERT INTO customer_transactions (customer_id, transaction_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
                                    db.run(customerTxSql, [
                                        customer.id,
                                        orderId,
                                        'ORDER',
                                        final_amount,
                                        `Đơn hàng #${orderId}`
                                    ], (err) => {
                                        if (err) console.error('Error saving customer transaction:', err.message);
                                        res.json({ success: true });
                                    });
                                } else {
                                    res.json({ success: true });
                                }
                            });
                        } else {
                            res.json({ success: true });
                        }
                    });
                }
            });
        });
    },

    show: (req, res) => {
        const id = req.params.id;
        Order.getById(id, (err, order) => {
            if (err) return res.status(500).send(err.message);
            res.render('pos/show', {
                title: 'Chi tiết đơn hàng #' + id,
                order,
                active: 'pos'
            });
        });
    },

    showByCode: (req, res) => {
        const code = req.params.code;
        Order.getByCode(code, (err, order) => {
            if (err) return res.status(500).send(err.message);
            if (!order) return res.status(404).send('Không tìm thấy đơn hàng');
            res.render('pos/show', {
                title: 'Chi tiết đơn hàng ' + code,
                order,
                active: 'pos'
            });
        });
    }
};

module.exports = orderController;
