const db = require('../src/config/database');

db.serialize(() => {
    db.all("SELECT id FROM orders ORDER BY created_at ASC", [], (err, orders) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return;
        }

        console.log(`Found ${orders.length} orders to process.`);

        let completed = 0;
        orders.forEach((order, index) => {
            const nextNumber = (index + 1).toString().padStart(6, '0');
            const code = 'DH' + nextNumber;

            db.run("UPDATE orders SET code = ? WHERE id = ?", [code, order.id], (err) => {
                if (err) {
                    console.error(`Error updating order ${order.id}:`, err);
                } else {
                    console.log(`Updated order ${order.id} with code ${code}`);
                }
                completed++;
                if (completed === orders.length) {
                    console.log("Backfill completed.");
                }
            });
        });
    });
});
