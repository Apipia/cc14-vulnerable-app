const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
// Use absolute path or path relative to app directory
// In Docker: /app/database, locally: ../../database
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/claim_manager.db');
// Ensure database directory exists
const fs = require('fs');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database for initialization');
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Claims table
  db.run(`CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample data for security workshop
  db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES 
    ('admin', 'admin@claimmanager.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
    ('alice', 'alice@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('bob', 'bob@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
  `);

  db.run(`INSERT OR IGNORE INTO categories (name, description) VALUES 
    ('Travel', 'Travel and transportation expenses'),
    ('Meals', 'Food and dining expenses'),
    ('Office Supplies', 'Office equipment and supplies'),
    ('Training', 'Professional development and training'),
    ('Other', 'Miscellaneous expenses')
  `);

  // Clear existing claims first
  db.run('DELETE FROM claims');
  
  // Insert new claims with correct user IDs
  db.run(`INSERT INTO claims (user_id, title, description, amount, status, category) VALUES 
    (1, 'Admin System Upgrade', 'Server hardware upgrade for production', 5000.00, 'approved', 'Office Supplies'),
    (1, 'Security Training', 'Penetration testing course certification', 1200.00, 'approved', 'Training'),
    (5, 'Alice Personal Travel', 'Personal vacation to Hawaii', 2500.00, 'pending', 'Travel'),
    (5, 'Alice Office Supplies', 'New laptop for remote work', 1200.00, 'approved', 'Office Supplies'),
    (5, 'Alice Conference', 'Tech conference in San Francisco', 800.00, 'pending', 'Training'),
    (6, 'Bob Conference Trip', 'Security conference in Las Vegas', 1800.00, 'pending', 'Travel'),
    (6, 'Bob Office Chair', 'Ergonomic office chair for home office', 299.99, 'approved', 'Office Supplies'),
    (6, 'Bob Training', 'Cybersecurity certification course', 1500.00, 'pending', 'Training'),
    (5, 'Team Meeting Lunch', 'Monthly team building lunch', 85.50, 'pending', 'shared'),
    (6, 'Company Retreat', 'Annual company retreat expenses', 500.00, 'pending', 'shared')
  `);

  console.log('Database tables created successfully');
  console.log('Sample data inserted');
});

// Close database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
    process.exit(1);
  }
  console.log('Database initialization completed successfully');
  process.exit(0);
});
