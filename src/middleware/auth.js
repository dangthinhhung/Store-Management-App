// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Middleware to check if user is owner/admin
const isOwner = (req, res, next) => {
    console.log('Checking Owner Permission. Session User:', req.session ? req.session.user : 'No Session');
    if (req.session && req.session.user && req.session.user.userRole === 'OWNER') {
        return next();
    }
    // Return 403 page with popup
    return res.status(403).render('error', {
        title: 'Truy cập bị từ chối',
        message: 'Bạn không có quyền truy cập trang này',
        showPopup: true,
        layout: 'main'
    });
};

module.exports = { isAuthenticated, isOwner };
