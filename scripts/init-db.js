const sequelize = require('../config/database');
const { User, Plan, Brand } = require('../models');

async function initializeDatabase() {
    try {
        // Sync all models with the database
        // force: false means it won't drop existing tables
        await sequelize.sync({ force: false });
        console.log('Database tables synchronized successfully');

        // Check if plans exist
        const existingPlans = await Plan.findAll();
        if (existingPlans.length === 0) {
            // Create default plans only if none exist
            const plans = await Plan.bulkCreate([
                {
                    name: 'free',
                    maxBrands: 1,
                    price: 0,
                    features: JSON.stringify(['Basic features']),
                    isActive: true
                },
                {
                    name: 'pro',
                    maxBrands: 5,
                    price: 29,
                    features: JSON.stringify(['Advanced features', 'Priority support']),
                    isActive: true
                },
                {
                    name: 'enterprise',
                    maxBrands: -1, // unlimited
                    price: 99,
                    features: JSON.stringify(['Premium features', '24/7 support', 'Custom integrations']),
                    isActive: true
                }
            ]);
            console.log('Default plans created successfully');
        } else {
            console.log('Plans already exist, skipping creation');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 