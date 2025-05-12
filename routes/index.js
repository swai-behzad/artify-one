const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Home',
        user: req.user,
        hideFooter: false
    });
});

// About page
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us',
        user: req.user,
        hideFooter: false
    });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact Us',
        user: req.user,
        hideFooter: false
    });
});

// Pricing page
router.get('/pricing', (req, res) => {
    res.render('pricing', {
        title: 'Pricing',
        user: req.user,
        hideFooter: false
    });
});

// Terms of Service page
router.get('/terms', (req, res) => {
    res.render('terms', {
        title: 'Terms of Service',
        user: req.user,
        hideFooter: false
    });
});

// Privacy Policy page
router.get('/privacy', (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy',
        user: req.user,
        hideFooter: false
    });
});

module.exports = router; 