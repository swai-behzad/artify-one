require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const { User, sequelize } = require('./models');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();

// Initialize database connection
async function initializeApp() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Create session store after database connection is established
        const sessionStore = new SequelizeStore({
            db: sequelize,
            expiration: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static(path.join(__dirname, 'public')));

        // Cookie parser - must be before session
        app.use(cookieParser());

        // Session configuration
        app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            store: sessionStore,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // Sync the session store with the database
        await sessionStore.sync();

        // Flash messages
        app.use(flash());

        // View engine setup
        app.use(expressLayouts);
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));
        app.set('layout', 'layouts/main');

        // Initialize Passport and restore authentication state from session
        app.use(passport.initialize());
        app.use(passport.session());

        // CSRF protection - after session and before routes
        app.use(csrf());

        // Global variables
        app.use((req, res, next) => {
            res.locals.messages = {
                error: req.flash('error'),
                success: req.flash('success')
            };
            res.locals.user = req.user;
            res.locals.NODE_ENV = process.env.NODE_ENV;
            res.locals.csrfToken = req.csrfToken();
            res.locals.hideFooter = false;  // Default value for hideFooter
            next();
        });

        // Passport configuration
        passport.use(new LocalStrategy(
            async (username, password, done) => {
                try {
                    console.log('Passport strategy - finding user:', username);
                    const user = await User.findOne({ where: { username } });

                    if (!user) {
                        console.log('Passport strategy - user not found');
                        return done(null, false, { message: 'Incorrect username.' });
                    }

                    console.log('Passport strategy - found user:', {
                        id: user.id,
                        username: user.username,
                        hasPassword: !!user.password
                    });

                    console.log('Passport strategy - validating password');
                    const isValidPassword = await user.validatePassword(password);
                    console.log('Passport strategy - password validation result:', isValidPassword);

                    if (!isValidPassword) {
                        console.log('Passport strategy - invalid password');
                        return done(null, false, { message: 'Incorrect password.' });
                    }

                    console.log('Passport strategy - authentication successful');
                    return done(null, user);
                } catch (err) {
                    console.error('Passport strategy - error:', err);
                    return done(err);
                }
            }
        ));

        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findByPk(id);
                done(null, user);
            } catch (err) {
                done(err);
            }
        });

        // Routes
        app.use('/', require('./routes/index'));
        app.use('/auth', require('./routes/auth'));
        app.use('/dashboard', require('./routes/dashboard'));
        app.use('/brand', require('./routes/brand'));

        // Error handler for CSRF
        app.use((err, req, res, next) => {
            if (err.code === 'EBADCSRFTOKEN') {
                req.flash('error', 'Invalid form submission. Please try again.');
                return res.redirect('back');
            }
            next(err);
        });

        // 404 handler
        app.use((req, res, next) => {
            res.status(404).render('error', {
                title: '404 - Page Not Found',
                message: 'The page you are looking for does not exist.',
                error: null
            });
        });

        // General error handler
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(err.status || 500).render('error', {
                title: 'Error',
                message: err.message || 'Something went wrong',
                error: process.env.NODE_ENV === 'development' ? err : null
            });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

// Start the application
initializeApp();

module.exports = app; 