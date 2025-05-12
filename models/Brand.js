const { DataTypes } = require('sequelize');

const Brand = {
    schema: {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        position: DataTypes.TEXT,
        target_audience: DataTypes.TEXT,
        purpose: DataTypes.TEXT,
        marketing_strategy: DataTypes.TEXT,
        visual_identity: DataTypes.TEXT,
        imagery_style: DataTypes.TEXT,
        messaging: DataTypes.TEXT,
        brand_voice: DataTypes.TEXT,
        competitive_analysis: DataTypes.TEXT,
        personality: DataTypes.TEXT,
        marketing_efforts: DataTypes.TEXT,
        competitor_analysis: DataTypes.TEXT,
        long_term_perspective: DataTypes.TEXT,
        brand_vision: DataTypes.TEXT,
        marketing_toolkit: DataTypes.TEXT,
        strategic_management: DataTypes.TEXT,
        brand_story: DataTypes.TEXT,
        website_recommendations: DataTypes.TEXT,
        value_proposition: DataTypes.TEXT,
        slogan: DataTypes.STRING,
        color_palette: DataTypes.TEXT,
        typography: DataTypes.TEXT,
        logo_url: DataTypes.STRING,
        domain_recommendations: DataTypes.TEXT,
        marketing_insights: DataTypes.TEXT,
        ideal_customer_profile: DataTypes.TEXT
    },
    options: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true
    }
};

module.exports = Brand; 