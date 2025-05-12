const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const User = {
    schema: {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 30]
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        plan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Plans',
                key: 'id'
            }
        },
        subscriptionStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'inactive',
            validate: {
                isIn: [['active', 'inactive', 'cancelled']]
            }
        },
        subscriptionEndDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    options: {
        timestamps: true,
        hooks: {
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    }
};

// Add instance methods
User.methods = {
    canCreateMoreBrands: async function() {
        // If no plan_id, user is on free plan
        if (!this.plan_id) {
            const brands = await this.getBrands();
            return brands.length < 1; // Free plan allows 1 brand
        }
        
        const plan = await this.getPlan();
        if (!plan) return false;
        const brands = await this.getBrands();
        return plan.maxBrands === -1 || brands.length < plan.maxBrands;
    },

    validatePassword: async function(password) {
        return bcrypt.compare(password, this.password);
    }
};

module.exports = User; 