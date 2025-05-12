-- Create database
CREATE DATABASE IF NOT EXISTS artify_one;
USE artify_one;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    position TEXT,
    target_audience TEXT,
    purpose TEXT,
    marketing_strategy TEXT,
    visual_identity TEXT,
    imagery_style TEXT,
    messaging TEXT,
    brand_voice TEXT,
    competitive_analysis TEXT,
    personality TEXT,
    marketing_efforts TEXT,
    competitor_analysis TEXT,
    long_term_perspective TEXT,
    brand_vision TEXT,
    marketing_toolkit TEXT,
    strategic_management TEXT,
    brand_story TEXT,
    website_recommendations TEXT,
    value_proposition TEXT,
    slogan TEXT,
    color_palette JSON,
    typography JSON,
    logo_url VARCHAR(255),
    domain_recommendations JSON,
    marketing_insights TEXT,
    ideal_customer_profile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_brands_user_id ON brands(user_id); 