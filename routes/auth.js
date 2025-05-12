const express = require('express');
const router = express.Router();
const passport = require('passport');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Login page
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Login',
        hideFooter: true
    });
});

// Login handler
router.post('/login', (req, res, next) => {
    console.log('Login attempt:', { 
        username: req.body.username,
        hasPassword: !!req.body.password,
        csrfToken: !!req.body._csrf
    });
    
    passport.authenticate('local', (err, user, info) => {
        console.log('Passport authenticate result:', { 
            err: err ? err.message : null,
            user: user ? {
                id: user.id,
                username: user.username,
                hasPassword: !!user.password
            } : 'not found',
            info
        });
        
        if (err) {
            console.error('Login error:', err);
            req.flash('error', 'An error occurred during login');
            return res.redirect('/auth/login');
        }
        
        if (!user) {
            console.log('Login failed:', info.message);
            req.flash('error', info.message || 'Invalid username or password');
            return res.redirect('/auth/login');
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                req.flash('error', 'An error occurred during login');
                return res.redirect('/auth/login');
            }
            
            console.log('Login successful for user:', {
                id: user.id,
                username: user.username
            });
            req.flash('success', 'Successfully logged in');
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Signup page
router.get('/signup', (req, res) => {
    res.render('auth/signup', { 
        title: 'Sign Up',
        hideFooter: true
    });
});

// Signup handler
router.post('/signup', async (req, res) => {
    console.log('Signup attempt:', { 
        username: req.body.username,
        email: req.body.email,
        hasPassword: !!req.body.password,
        hasConfirmPassword: !!req.body.confirmPassword,
        csrfToken: !!req.body._csrf
    });

    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (password !== confirmPassword) {
        console.log('Password validation failed:', { 
            passwordLength: password?.length,
            confirmPasswordLength: confirmPassword?.length
        });
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/signup');
    }

    try {
        console.log('Checking for existing user...');
        // Check if user exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            console.log('User already exists:', { 
                existingUsername: existingUser.username === username,
                existingEmail: existingUser.email === email
            });
            req.flash('error', 'Username or email already exists');
            return res.redirect('/auth/signup');
        }

        console.log('Creating new user...');
        // Create user
        const newUser = await User.create({
            username,
            email,
            password
        });

        console.log('User created successfully:', { 
            userId: newUser.id,
            username: newUser.username
        });

        req.flash('success', 'You are now registered and can log in');
        res.redirect('/auth/login');
    } catch (err) {
        console.error('Signup error:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        req.flash('error', 'Error during registration');
        res.redirect('/auth/signup');
    }
});

// Logout handler
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You are logged out');
        res.redirect('/auth/login');
    });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { 
        title: 'Forgot Password',
        hideFooter: true
    });
});

// Forgot password handler
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            req.flash('error', 'No account found with that email address');
            return res.redirect('/auth/forgot-password');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Update user with reset token
        await user.update({
            resetToken,
            resetTokenExpires
        });

        // In a real application, you would send an email here
        req.flash('success', 'Password reset instructions have been sent to your email');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error processing your request');
        res.redirect('/auth/forgot-password');
    }
});

// Reset password page
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                resetToken: req.params.token,
                resetTokenExpires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        res.render('auth/reset-password', {
            title: 'Reset Password',
            token: req.params.token
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error processing your request');
        res.redirect('/auth/forgot-password');
    }
});

// Reset password handler
router.post('/reset-password/:token', async (req, res) => {
    const { password, confirmPassword } = req.body;
    const token = req.params.token;

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect(`/auth/reset-password/${token}`);
    }

    try {
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        // Update password and clear reset token
        await user.update({
            password,
            resetToken: null,
            resetTokenExpires: null
        });

        req.flash('success', 'Your password has been updated');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating password');
        res.redirect(`/auth/reset-password/${token}`);
    }
});

module.exports = router;