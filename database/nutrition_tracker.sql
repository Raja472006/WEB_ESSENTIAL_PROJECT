-- NutriTrack – Food & Nutrition Tracker Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB

CREATE DATABASE IF NOT EXISTS nutrition_tracker;
USE nutrition_tracker;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,
    height DECIMAL(5, 2) NULL, -- in cm
    weight DECIMAL(5, 2) NULL, -- in kg
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Foods Reference Table (Seed & searchable catalog)
CREATE TABLE IF NOT EXISTS foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    food_name VARCHAR(100) NOT NULL UNIQUE,
    default_quantity VARCHAR(50) DEFAULT '1 serving',
    calories DECIMAL(7, 2) NOT NULL,
    protein DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    carbohydrates DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    fat DECIMAL(6, 2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Food Logs Table (Daily records consumed by users)
CREATE TABLE IF NOT EXISTS food_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NULL,
    food_name VARCHAR(100) NOT NULL,
    meal_type ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack') NOT NULL,
    quantity VARCHAR(50) DEFAULT '1 serving',
    calories DECIMAL(7, 2) NOT NULL,
    protein DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    carbohydrates DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    fat DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, log_date),
    INDEX idx_meal_type (meal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Nutrition Goals Table (Targets per user)
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    calorie_goal DECIMAL(7, 2) DEFAULT 2000.00,
    protein_goal DECIMAL(6, 2) DEFAULT 100.00,
    carbohydrate_goal DECIMAL(6, 2) DEFAULT 250.00,
    fat_goal DECIMAL(6, 2) DEFAULT 70.00,
    water_goal INT DEFAULT 8,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Water Logs Table (Daily glasses per user)
CREATE TABLE IF NOT EXISTS water_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    glasses INT NOT NULL DEFAULT 0,
    log_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_water_date (user_id, log_date),
    INDEX idx_user_water_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed Food Data (Indian & Global Staples with typical values per serving)
INSERT INTO foods (food_name, default_quantity, calories, protein, carbohydrates, fat) VALUES
('Idli', '2 pieces (100g)', 130.00, 4.00, 26.00, 0.80),
('Dosa', '1 plain dosa (120g)', 168.00, 3.80, 29.00, 3.70),
('Rice', '1 cup cooked (150g)', 195.00, 4.20, 44.00, 0.40),
('Chapati', '1 roti (40g)', 104.00, 3.10, 18.00, 2.80),
('Sambar', '1 bowl (150g)', 115.00, 4.50, 18.00, 2.50),
('Curd Rice', '1 bowl (200g)', 240.00, 6.00, 35.00, 8.00),
('Vegetable Rice', '1 plate (200g)', 260.00, 5.00, 48.00, 6.00),
('Chicken', '1 serving cooked (100g)', 215.00, 24.00, 0.00, 12.00),
('Chicken Breast', '1 grilled breast (150g)', 248.00, 46.50, 0.00, 5.40),
('Egg', '1 whole boiled egg (50g)', 78.00, 6.30, 0.60, 5.30),
('Milk', '1 glass (240ml)', 150.00, 8.00, 12.00, 8.00),
('Curd', '1 bowl plain yogurt (150g)', 98.00, 5.20, 7.00, 5.00),
('Paneer', '1 serving raw (100g)', 265.00, 18.30, 3.40, 20.80),
('Oats', '1 bowl cooked (200g)', 150.00, 5.00, 27.00, 2.50),
('Banana', '1 medium banana (118g)', 105.00, 1.30, 27.00, 0.30),
('Apple', '1 medium apple (182g)', 95.00, 0.50, 25.00, 0.30),
('Orange', '1 medium orange (131g)', 62.00, 1.20, 15.40, 0.20),
('Bread', '2 slices whole wheat (60g)', 140.00, 6.00, 24.00, 2.00),
('Peanut', '1 handful roasted (30g)', 170.00, 7.50, 4.80, 14.20),
('Almond', '1 serving raw (28g / 23 nuts)', 164.00, 6.00, 6.10, 14.10),
('Dal', '1 bowl cooked yellow dal (150g)', 140.00, 8.00, 22.00, 2.20),
('Fish', '1 fillet grilled fish (150g)', 175.00, 32.00, 0.00, 4.50)
ON DUPLICATE KEY UPDATE 
    calories = VALUES(calories),
    protein = VALUES(protein),
    carbohydrates = VALUES(carbohydrates),
    fat = VALUES(fat);
