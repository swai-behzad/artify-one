const { DataTypes } = require('sequelize');

const Plan = {
    schema: {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['free', 'pro', 'enterprise']]
            }
        },
        maxBrands: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        features: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    options: {
        timestamps: true
    }
};

module.exports = Plan; 