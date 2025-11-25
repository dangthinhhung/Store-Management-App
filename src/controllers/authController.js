const db = require('../config/database');
const bcrypt = require('bcrypt');

const authController = {
    loginForm: (req, res) => {
        if (req.session.user) {
            return res.redirect('/pos'); // Redirect to POS as per new requirement (Dashboard removed)
        }
        res.render('login', { layout: false });
    },

    login: (req, res) => {
        const username = req.body.username ? req.body.username.trim() : '';
        const password = req.body.password;

        db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
            if (err) {
                console.error('Login DB Error:', err);
                return res.render('login', { layout: false, error: 'Lỗi hệ thống' });
            }

            if (!user) {
                return res.render('login', { layout: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
            }

            try {
                const match = await bcrypt.compare(password, user.password);

                if (match) {
                    req.session.user = {
                        userId: user.id,
                        username: user.username,
                        userRole: user.role,
                        userFullName: user.full_name
                    };
                    return res.redirect('/pos');
                } else {
                    return res.render('login', { layout: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
                }
            } catch (error) {
                console.error('Bcrypt Error:', error);
                return res.render('login', { layout: false, error: 'Lỗi xác thực' });
            }
        });
    },

    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    }
};

module.exports = authController;
