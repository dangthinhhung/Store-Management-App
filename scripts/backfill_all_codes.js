const db = require('../src/config/database');

db.serialize(() => {
    // Backfill Imports
    db.all("SELECT id FROM imports ORDER BY created_at ASC", [], (err, imports) => {
        if (err) {
            console.error("Error fetching imports:", err);
            return;
        }

        console.log(`Found ${imports.length} imports to process.`);

        let completedImports = 0;
        if (imports.length === 0) {
            console.log("No imports to backfill.");
            checkAllDone();
        } else {
            imports.forEach((item, index) => {
                const nextNumber = (index + 1).toString().padStart(6, '0');
                const code = 'NHAP' + nextNumber;

                db.run("UPDATE imports SET code = ? WHERE id = ?", [code, item.id], (err) => {
                    if (err) {
                        console.error(`Error updating import ${item.id}:`, err);
                    } else {
                        console.log(`Updated import ${item.id} with code ${code}`);
                    }
                    completedImports++;
                    if (completedImports === imports.length) {
                        console.log("Imports backfill completed.");
                        checkAllDone();
                    }
                });
            });
        }
    });

    // Backfill Workshop Orders
    db.all("SELECT id FROM workshop_orders ORDER BY created_at ASC", [], (err, orders) => {
        if (err) {
            console.error("Error fetching workshop orders:", err);
            return;
        }

        console.log(`Found ${orders.length} workshop orders to process.`);

        let completedWorkshop = 0;
        if (orders.length === 0) {
            console.log("No workshop orders to backfill.");
            checkAllDone();
        } else {
            orders.forEach((item, index) => {
                const nextNumber = (index + 1).toString().padStart(6, '0');
                const code = 'SC' + nextNumber;

                db.run("UPDATE workshop_orders SET code = ? WHERE id = ?", [code, item.id], (err) => {
                    if (err) {
                        console.error(`Error updating workshop order ${item.id}:`, err);
                    } else {
                        console.log(`Updated workshop order ${item.id} with code ${code}`);
                    }
                    completedWorkshop++;
                    if (completedWorkshop === orders.length) {
                        console.log("Workshop backfill completed.");
                        checkAllDone();
                    }
                });
            });
        }
    });
});

let finishedTasks = 0;
function checkAllDone() {
    finishedTasks++;
    if (finishedTasks === 2) {
        console.log("All backfills completed.");
    }
}
