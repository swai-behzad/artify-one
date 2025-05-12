// Authentication middleware
function isAuthenticated(req, res, next) {
    // Check if user is authenticated
    if (req.isAuthenticated()) {
        // Check if session is still valid
        if (req.session && req.session.passport && req.session.passport.user) {
            return next();
        }
    }
    
    // Store the original URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    
    // Only redirect if not already on the login page to prevent loops
    if (!req.originalUrl.includes('/auth/login')) {
        req.flash('error', 'Please log in to access this page');
        res.redirect('/auth/login');
    } else {
        next();
    }
}

module.exports = {
    isAuthenticated
}; 