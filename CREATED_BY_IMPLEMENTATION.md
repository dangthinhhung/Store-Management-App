# TRACKING NGƯỜI TẠO - IMPLEMENTATION GUIDE

## ✅ ĐÃ HOÀN THÀNH:
1. Database schema updated (added `created_by` column to all tables)
2. All existing data set to "admin"
3. Created helper function `formatCreatedBy()` in `/src/utils/userHelper.js`

## 📝 CẦN CẬP NHẬT:

### A. MODELS - Add `created_by` to INSERT statements:

**1. /src/models/orderModel.js - Line 73:**
```javascript
// BEFORE:
db.run(`INSERT INTO orders (customer_phone, code, total_amount, discount, final_amount, status, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [data.customer_phone, code, data.total_amount, data.discount, data.final_amount, 'PAID', data.payment_method || 'Tiền mặt'],

// AFTER:
db.run(`INSERT INTO orders (customer_phone, code, total_amount, discount, final_amount, status, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [data.customer_phone, code, data.total_amount, data.discount, data.final_amount, 'PAID', data.payment_method || 'Tiền mặt', data.created_by || 'admin'],
```

**2. /src/models/workshopModel.js - Line ~30:**
```javascript
// Add created_by to workshop_orders INSERT
db.run(`INSERT INTO workshop_orders (code, customer_phone, total_cost, total_paid, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [code, data.customer_phone, data.total_cost, data.total_paid || 0, 'IN_REPAIR', data.created_by || 'admin'],
```

**3. /src/models/productModel.js - Line ~15:**
```javascript
// Add created_by to products INSERT
const sql = `INSERT INTO products (product_code, name, default_selling_price, unit, stock_quantity, is_active, search_string, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
db.run(sql, [
    data.product_code,
    data.name,
    data.default_selling_price,
    data.unit,
    data.stock_quantity,
    data.is_active,
    searchStr,
    data.created_by || 'admin'
], callback);
```

**4. /src/models/importModel.js - Line ~25:**
```javascript
// Add created_by to imports INSERT
db.run(`INSERT INTO imports (code, total_cost, payment_method, created_by, created_at) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
    [code, data.total_cost, data.payment_method || 'Chuyển khoản', data.created_by || 'admin'],
```

**5. /src/models/customerModel.js - Line ~10:**
```javascript
// Add created_by to customers INSERT
const sql = `INSERT INTO customers (phone, name, address, created_by) VALUES (?, ?, ?, ?)`;
db.run(sql, [data.phone, data.name, data.address, data.created_by || 'admin'], callback);
```

### B. CONTROLLERS - Pass `created_by` when creating:

**1. /src/controllers/orderController.js - store() method:**
```javascript
const { formatCreatedBy } = require('../utils/userHelper');

store: (req, res) => {
    const createdBy = formatCreatedBy(req.session.user);
    
    // ... existing code ...
    
    const orderData = {
        customer_phone,
        total_amount,
        discount,
        final_amount,
        payment_method,
        items,
        created_by: createdBy  // ADD THIS
    };
    
    Order.create(orderData, ...);
}
```

**2. /src/controllers/workshopController.js - store():**
```javascript
const { formatCreatedBy } = require('../utils/userHelper');

store: (req, res) => {
    const createdBy = formatCreatedBy(req.session.user);
    
    const orderData = {
        customer_phone,
        total_cost,
        total_paid: 0,
        items,
        created_by: createdBy  // ADD THIS
    };
}
```

**3. /src/controllers/productController.js - store():**
```javascript
const { formatCreatedBy } = require('../utils/userHelper');

store: (req, res) => {
    const createdBy = formatCreatedBy(req.session.user);
    req.body.created_by = createdBy;  // ADD THIS
    Product.create(req.body, ...);
}
```

**4. /src/controllers/importController.js - store():**
```javascript
const { formatCreatedBy } = require('../utils/userHelper');

store: (req, res) => {
    const createdBy = formatCreatedBy(req.session.user);
    
    // ... existing code ...
    
    Import.create({ items, total_cost, payment_method, created_by: createdBy }, ...);
}
```

**5. /src/controllers/customerController.js - store() (if exists):**
```javascript
const { formatCreatedBy } = require('../utils/userHelper');

store: (req, res) => {
    const createdBy = formatCreatedBy(req.session.user);
    req.body.created_by = createdBy;
    Customer.create(req.body, ...);
}
```

### C. AUTH CONTROLLER - Store full user info in session:

**/src/controllers/authController.js - login() method:**
```javascript
// AFTER line: if (match) {
req.session.user = {
    userId: user.id,
    username: user.username,
    userRole: user.role,
    userFullName: user.full_name  // ADD THIS LINE
};
```

### D. VIEWS - Display created_by info:

**1. /src/views/pos/show.hbs - Add row:**
```handlebars
<p><strong>Người tạo:</strong> {{order.created_by}}</p>
```

**2. /src/views/workshop/show.hbs - Add row:**
```handlebars
<p><strong>Người tạo:</strong> {{order.created_by}}</p>
```

**3. /src/views/products/index.hbs - Add column:**
```handlebars
<th>Người tạo</th>
...
<td>{{this.created_by}}</td>
```

**4. /src/views/imports/show.hbs - Add row:**
```handlebars
<p><strong>Người tạo:</strong> {{import.created_by}}</p>
```

**5. /src/views/customers/show.hbs - Add row:**
```handlebars
<p><strong>Người tạo:</strong> {{customer.created_by}}</p>
```

**6. History pages - Add to each entry display**

## 🔧 TESTING CHECKLIST:
- [ ] Login as admin → create order → check created_by = "admin"
- [ ] Login as staff → create order → check created_by = "TênStaff - ID"  
- [ ] View order detail → see created_by displayed
- [ ] Same for workshop, products, imports, customers
- [ ] Check history pages show created_by

## ⚠️ IMPORTANT NOTES:
- All `req.session.user` must now have: userId, username, userRole, userFullName
- formatCreatedBy returns "admin" for OWNER, "Name - ID" for STAFF
- All existing data defaults to "admin"
