const { Plan, User, Brand } = require('../models');
const sequelize = require('../config/database');

const defaultPlans = [
    {
        name: 'free',
        maxBrands: 1,
        price: 0,
        features: [
            'Basic Brand Strategy',
            'Standard Support',
            '1 Brand'
        ],
        isActive: true
    },
    {
        name: 'pro',
        maxBrands: 5,
        price: 29,
        features: [
            'Advanced Brand Strategy',
            'Priority Support',
            'Custom Brand Templates',
            '5 Brands'
        ],
        isActive: true
    },
    {
        name: 'enterprise',
        maxBrands: -1, // Unlimited
        price: 99,
        features: [
            'Premium Brand Strategy',
            '24/7 Support',
            'Custom Brand Templates',
            'API Access',
            'Unlimited Brands'
        ],
        isActive: true
    }
];

async function initPlans() {
    try {
        // Sync all tables with force: true to recreate them
        await sequelize.sync({ force: true });
        console.log('Connected to database and recreated tables');

        // Insert default plans
        await Plan.bulkCreate(defaultPlans);
        console.log('Initialized default plans');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing plans:', error);
        process.exit(1);
    }
}

initPlans(); 