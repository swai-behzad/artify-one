require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const Brand = require('../models/Brand');

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Sync without dropping tables (alter: true will modify existing tables if needed)
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing database:', error);
        process.exit(1);
    }
}

syncDatabase(); 