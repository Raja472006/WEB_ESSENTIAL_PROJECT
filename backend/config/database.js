const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let dbInstance = null;
let activeEngine = 'mysql';

const SEED_FOODS = [
  { name: 'Idli', qty: '2 pieces (100g)', cal: 130, p: 4, c: 26, f: 0.8 },
  { name: 'Dosa', qty: '1 plain dosa (120g)', cal: 168, p: 3.8, c: 29, f: 3.7 },
  { name: 'Rice', qty: '1 cup cooked (150g)', cal: 195, p: 4.2, c: 44, f: 0.4 },
  { name: 'Chapati', qty: '1 roti (40g)', cal: 104, p: 3.1, c: 18, f: 2.8 },
  { name: 'Sambar', qty: '1 bowl (150g)', cal: 115, p: 4.5, c: 18, f: 2.5 },
  { name: 'Curd Rice', qty: '1 bowl (200g)', cal: 240, p: 6, c: 35, f: 8 },
  { name: 'Vegetable Rice', qty: '1 plate (200g)', cal: 260, p: 5, c: 48, f: 6 },
  { name: 'Chicken', qty: '1 serving cooked (100g)', cal: 215, p: 24, c: 0, f: 12 },
  { name: 'Chicken Breast', qty: '1 grilled breast (150g)', cal: 248, p: 46.5, c: 0, f: 5.4 },
  { name: 'Egg', qty: '1 whole boiled egg (50g)', cal: 78, p: 6.3, c: 0.6, f: 5.3 },
  { name: 'Milk', qty: '1 glass (240ml)', cal: 150, p: 8, c: 12, f: 8 },
  { name: 'Curd', qty: '1 bowl plain yogurt (150g)', cal: 98, p: 5.2, c: 7, f: 5 },
  { name: 'Paneer', qty: '1 serving raw (100g)', cal: 265, p: 18.3, c: 3.4, f: 20.8 },
  { name: 'Oats', qty: '1 bowl cooked (200g)', cal: 150, p: 5, c: 27, f: 2.5 },
  { name: 'Banana', qty: '1 medium banana (118g)', cal: 105, p: 1.3, c: 27, f: 0.3 },
  { name: 'Apple', qty: '1 medium apple (182g)', cal: 95, p: 0.5, c: 25, f: 0.3 },
  { name: 'Orange', qty: '1 medium orange (131g)', cal: 62, p: 1.2, c: 15.4, f: 0.2 },
  { name: 'Bread', qty: '2 slices whole wheat (60g)', cal: 140, p: 6, c: 24, f: 2 },
  { name: 'Peanut', qty: '1 handful roasted (30g)', cal: 170, p: 7.5, c: 4.8, f: 14.2 },
  { name: 'Almond', qty: '1 serving raw (28g / 23 nuts)', cal: 164, p: 6, c: 6.1, f: 14.1 },
  { name: 'Dal', qty: '1 bowl cooked yellow dal (150g)', cal: 140, p: 8, c: 22, f: 2.2 },
  { name: 'Fish', qty: '1 fillet grilled fish (150g)', cal: 175, p: 32, c: 0, f: 4.5 }
];

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'nutrition_tracker';

  try {
    // Attempt MySQL connection
    console.log(`[Database] Connecting to MySQL at ${host}:${port} as ${user}...`);
    const initialConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 3000
    });

    await initialConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await initialConn.end();

    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const testConn = await pool.getConnection();
    testConn.release();

    console.log(`[Database] Connected to MySQL database "${database}" successfully.`);
    activeEngine = 'mysql';

    // Auto-create MySQL tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        age INT NULL,
        gender VARCHAR(20) NULL,
        height DECIMAL(5, 2) NULL,
        weight DECIMAL(5, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL UNIQUE,
        default_quantity VARCHAR(50) DEFAULT '1 serving',
        calories DECIMAL(7, 2) NOT NULL,
        protein DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
        carbohydrates DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
        fat DECIMAL(6, 2) NOT NULL DEFAULT 0.00
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
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
        INDEX idx_user_date (user_id, log_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nutrition_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        calorie_goal DECIMAL(7, 2) DEFAULT 2000.00,
        protein_goal DECIMAL(6, 2) DEFAULT 100.00,
        carbohydrate_goal DECIMAL(6, 2) DEFAULT 250.00,
        fat_goal DECIMAL(6, 2) DEFAULT 70.00,
        water_goal INT DEFAULT 8,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        glasses INT NOT NULL DEFAULT 0,
        log_date DATE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_water_date (user_id, log_date),
        INDEX idx_user_water_date (user_id, log_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check and seed foods if empty
    const [foodRows] = await pool.query('SELECT COUNT(*) as cnt FROM foods');
    if (foodRows[0].cnt === 0) {
      console.log('[Database] Seeding initial foods into MySQL...');
      for (const item of SEED_FOODS) {
        await pool.query(
          `INSERT INTO foods (food_name, default_quantity, calories, protein, carbohydrates, fat)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE calories=VALUES(calories)`,
          [item.name, item.qty, item.cal, item.p, item.c, item.f]
        );
      }
      console.log(`[Database] Seeded ${SEED_FOODS.length} foods into MySQL.`);
    }

    dbInstance = {
      engine: 'mysql',
      query: (sql, params = []) => pool.query(sql, params)
    };

    return dbInstance;
  } catch (err) {
    console.warn(`[Database] MySQL unavailable (${err.message}).`);
    console.log('[Database] Initializing seamless SQLite fallback to ensure complete instant functionality...');
    activeEngine = 'sqlite';

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const sqlitePath = path.join(dataDir, 'nutrition_tracker.sqlite');
    const sqliteDb = new sqlite3.Database(sqlitePath);

    // Promisified SQLite wrapper compatible with mysql2/promise `[rows, fields]` interface
    const executeSqlite = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Adjust MySQL functions if any
        let normalizedSql = sql
          .replace(/CURDATE\(\)/gi, "date('now', 'localtime')")
          .replace(/NOW\(\)/gi, "datetime('now', 'localtime')")
          .replace(/ON DUPLICATE KEY UPDATE.*/gi, '');

        const trimmed = normalizedSql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
          sqliteDb.all(normalizedSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve([rows || [], []]);
          });
        } else {
          sqliteDb.run(normalizedSql, params, function (err) {
            if (err) return reject(err);
            resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
          });
        }
      });
    };

    // Create SQLite schema
    await executeSqlite(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        height REAL,
        weight REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeSqlite(`
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_name TEXT NOT NULL UNIQUE,
        default_quantity TEXT DEFAULT '1 serving',
        calories REAL NOT NULL,
        protein REAL NOT NULL DEFAULT 0,
        carbohydrates REAL NOT NULL DEFAULT 0,
        fat REAL NOT NULL DEFAULT 0
      )
    `);

    await executeSqlite(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        food_id INTEGER,
        food_name TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        quantity TEXT DEFAULT '1 serving',
        calories REAL NOT NULL,
        protein REAL NOT NULL DEFAULT 0,
        carbohydrates REAL NOT NULL DEFAULT 0,
        fat REAL NOT NULL DEFAULT 0,
        log_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
      )
    `);

    await executeSqlite(`
      CREATE TABLE IF NOT EXISTS nutrition_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        calorie_goal REAL DEFAULT 2000,
        protein_goal REAL DEFAULT 100,
        carbohydrate_goal REAL DEFAULT 250,
        fat_goal REAL DEFAULT 70,
        water_goal INTEGER DEFAULT 8,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await executeSqlite(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        glasses INTEGER NOT NULL DEFAULT 0,
        log_date TEXT NOT NULL,
        UNIQUE (user_id, log_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check and seed SQLite foods
    const [existingFoods] = await executeSqlite('SELECT COUNT(*) as cnt FROM foods');
    if (!existingFoods[0] || existingFoods[0].cnt === 0) {
      console.log('[Database] Seeding initial foods into SQLite...');
      for (const item of SEED_FOODS) {
        await executeSqlite(
          `INSERT OR IGNORE INTO foods (food_name, default_quantity, calories, protein, carbohydrates, fat)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.name, item.qty, item.cal, item.p, item.c, item.f]
        );
      }
      console.log(`[Database] Seeded ${SEED_FOODS.length} foods into SQLite database.`);
    }

    dbInstance = {
      engine: 'sqlite',
      query: executeSqlite
    };

    console.log('[Database] Embedded database is ready. (MySQL dump is also available in database/nutrition_tracker.sql)');
    return dbInstance;
  }
}

// Export a proxy query helper that ensures initialization before executing queries
const db = {
  getEngine: () => activeEngine,
  query: async (sql, params = []) => {
    if (!dbInstance) {
      await initializeDatabase();
    }
    return dbInstance.query(sql, params);
  },
  init: initializeDatabase
};

module.exports = db;
