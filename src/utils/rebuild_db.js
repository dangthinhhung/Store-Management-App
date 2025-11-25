const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, '../../data/store.db');

// Delete existing DB if exists
if (fs.existsSync(dbPath)) {
    console.log('Deleting existing database...');
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

const rebuild = async () => {
    console.log('Starting Database Rebuild...');

    db.serialize(() => {
        // 1. Users Table
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('OWNER', 'STAFF')),
            full_name TEXT,
            phone TEXT,
            dob TEXT,
            plain_password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Customers Table
        db.run(`CREATE TABLE customers (
            phone TEXT PRIMARY KEY,
            code TEXT UNIQUE,
            name TEXT NOT NULL,
            address TEXT,
            note TEXT,
            search_string TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Products Table
        db.run(`CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            default_selling_price REAL DEFAULT 0,
            unit TEXT,
            stock_quantity INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            import_price REAL DEFAULT 0,
            search_string TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 4. Orders Table (Retail)
        db.run(`CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_phone TEXT,
            user_id INTEGER,
            total_amount REAL NOT NULL,
            discount REAL DEFAULT 0,
            final_amount REAL NOT NULL,
            status TEXT DEFAULT 'PAID',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_phone) REFERENCES customers(phone),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // 5. Order Items Table
        db.run(`CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        // 6. Imports Table
        db.run(`CREATE TABLE imports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_cost REAL DEFAULT 0,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 7. Import Items Table
        db.run(`CREATE TABLE import_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            import_id INTEGER NOT NULL,
            product_code TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            import_price REAL NOT NULL,
            FOREIGN KEY(import_id) REFERENCES imports(id),
            FOREIGN KEY(product_code) REFERENCES products(product_code)
        )`);

        // 8. Workshop Orders Table
        db.run(`CREATE TABLE workshop_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_phone TEXT,
            user_id INTEGER,
            total_cost REAL DEFAULT 0,
            total_paid REAL DEFAULT 0,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_phone) REFERENCES customers(phone),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // 9. Workshop Items Table
        db.run(`CREATE TABLE workshop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workshop_order_id INTEGER NOT NULL,
            device_type TEXT,
            device_code TEXT,
            issue_description TEXT,
            repair_price REAL DEFAULT 0,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY(workshop_order_id) REFERENCES workshop_orders(id)
        )`);

        // 10. Workshop Payments Table
        db.run(`CREATE TABLE workshop_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workshop_order_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(workshop_order_id) REFERENCES workshop_orders(id)
        )`);

        // 11. Custom Transactions Table
        db.run(`CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
            amount REAL NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 12. Salaries Table
        db.run(`CREATE TABLE salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            month TEXT NOT NULL,
            year TEXT NOT NULL,
            payment_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        console.log('Tables created.');
    });

    // Seed Admin User
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO users (username, password, plain_password, role, full_name) VALUES (?, ?, ?, ?, ?)`,
        ['admin', hashedPassword, password, 'OWNER', 'Admin User'], (err) => {
            if (err) console.error('Error seeding admin:', err);
            else console.log('Admin user seeded (admin/admin).');

            db.close(() => {
                console.log('Database rebuild complete.');
            });
        });
};

rebuild();
