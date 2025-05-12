const { Sequelize, Model } = require('sequelize');
const User = require('./User');
const Brand = require('./Brand');
const Plan = require('./Plan');

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/artify', {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    }
});

// Initialize models with sequelize instance
class UserModel extends Model {}
UserModel.init(User.schema, { sequelize, ...User.options });
Object.assign(UserModel.prototype, User.methods);

class BrandModel extends Model {}
BrandModel.init(Brand.schema, { sequelize, ...Brand.options });

class PlanModel extends Model {}
PlanModel.init(Plan.schema, { sequelize, ...Plan.options });

// Define relationships
UserModel.hasMany(BrandModel, {
    foreignKey: 'user_id',
    as: 'brands'
});

BrandModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user'
});

UserModel.belongsTo(PlanModel, {
    foreignKey: 'plan_id',
    as: 'plan'
});

PlanModel.hasMany(UserModel, {
    foreignKey: 'plan_id',
    as: 'users'
});

module.exports = {
    sequelize,
    User: UserModel,
    Brand: BrandModel,
    Plan: PlanModel
}; 