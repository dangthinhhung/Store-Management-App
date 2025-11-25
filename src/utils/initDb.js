const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const createTables = () => {
    const schemas = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('OWNER', 'STAFF')),
            full_name TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            note TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            product_code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            default_selling_price REAL NOT NULL,
            unit TEXT,
            stock_quantity INTEGER DEFAULT 0,
            import_price REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1
        )`,
        `CREATE TABLE IF NOT EXISTS imports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_cost REAL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS import_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            import_id INTEGER,
            product_code TEXT,
            quantity INTEGER,
            import_price REAL,
            FOREIGN KEY(import_id) REFERENCES imports(id),
            FOREIGN KEY(product_code) REFERENCES products(product_code)
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            user_id INTEGER,
            total_amount REAL,
            discount REAL DEFAULT 0,
            final_amount REAL,
            status TEXT DEFAULT 'PAID',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_id) REFERENCES customers(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_code TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_code) REFERENCES products(product_code)
        )`,
        `CREATE TABLE IF NOT EXISTS workshop_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            user_id INTEGER,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_id) REFERENCES customers(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS workshop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workshop_order_id INTEGER,
            device_type TEXT,
            device_code TEXT,
            issue_description TEXT,
            repair_price REAL DEFAULT 0,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY(workshop_order_id) REFERENCES workshop_orders(id)
        )`,
        `CREATE TABLE IF NOT EXISTS workshop_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workshop_order_id INTEGER,
            amount REAL,
            paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(workshop_order_id) REFERENCES workshop_orders(id)
        )`,
        `CREATE TABLE IF NOT EXISTS salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount REAL,
            month INTEGER,
            year INTEGER,
            paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`
    ];

    db.serialize(() => {
        schemas.forEach((schema) => {
            db.run(schema, (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                }
            });
        });
        console.log('Tables created successfully.');
        seedData();
    });
};

const seedData = async () => {
    // Check if owner exists
    db.get("SELECT * FROM users WHERE role = 'OWNER'", async (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (!row) {
            const password = await bcrypt.hash('admin123', SALT_ROUNDS);
            db.run(`INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)`,
                ['admin', password, 'OWNER', 'Admin User'],
                (err) => {
                    if (err) console.error(err.message);
                    else console.log('Owner account created: admin / admin123');
                }
            );
        }
    });
};

createTables();
