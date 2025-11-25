const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

// Handlebars Setup
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        // Add helpers here later (e.g., formatCurrency)
        formatCurrency: (value) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
        },
        formatDate: (date) => {
            return new Date(date).toLocaleDateString('vi-VN');
        },
        formatDateTime: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleString('vi-VN');
        },
        formatMonth: (monthString) => {
            // monthString format: "YYYY-MM"
            if (!monthString) return '';
            const [year, month] = monthString.split('-');
            return `Tháng ${parseInt(month)} năm ${year}`;
        },
        eq: (a, b) => a == b,
        ne: (a, b) => a != b,
        gt: (a, b) => a > b,
        lt: (a, b) => a < b,
        gte: (a, b) => a >= b,
        lte: (a, b) => a <= b,
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        multiply: (a, b) => a * b,
        divide: (a, b) => a / b,
        workshopStatus: (status) => {
            const statusMap = {
                'IN_REPAIR': 'Đang sửa',
                'REPAIRED_DEBT': 'Đã sửa - Còn nợ',
                'PAID': 'Đã thanh toán toàn bộ',
                'RETURNED': 'Hoàn đơn'
            };
            return statusMap[status] || status;
        },
        contains: (str, substring) => {
            return str && str.includes(substring);
        },
        linkTransaction: (name, description) => {
            const text = name || description;
            if (!text) return '';

            // Regex for codes
            const patterns = [
                { regex: /(DH\d{6})/g, url: '/pos/code/' },
                { regex: /(NHAP\d{6})/g, url: '/imports/code/' },
                { regex: /(SC\d{6})/g, url: '/workshop/code/' },
                { regex: /(LUONG\d{6})/g, url: '/users/salary-slip/code/' }
            ];

            let linked = text;
            patterns.forEach(p => {
                linked = linked.replace(p.regex, (match) => {
                    return `<a href="${p.url}${match}" class="text-primary hover:underline">${match}</a>`;
                });
            });

            return linked;
        },
        or: (a, b) => a || b
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

const session = require('express-session');
const authRoutes = require('./routes/auth');

// Session Setup
app.use(session({
    secret: 'secret_key_manage_app_123', // In prod, use env var
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set true if https
}));

// Middleware to make user available in views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Auth Middleware
const { isAuthenticated, isOwner } = require('./middleware/auth');

// Routes
app.use('/', authRoutes);

// Protect all other routes
app.use(isAuthenticated);

const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/products');
const importRoutes = require('./routes/imports');
const orderRoutes = require('./routes/orders');
const workshopRoutes = require('./routes/workshop');
const customerRoutes = require('./routes/customers');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const transactionRoutes = require('./routes/transactions');


app.use('/', indexRoutes);
app.use('/products', productRoutes);
app.use('/imports', importRoutes);
app.use('/pos', orderRoutes);
app.use('/workshop', workshopRoutes);
app.use('/customers', customerRoutes);
app.use('/users', isOwner, userRoutes);
app.use('/reports', isOwner, reportRoutes);
app.use('/transactions', transactionRoutes);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
