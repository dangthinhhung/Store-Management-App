# Updates Summary - Customer Transactions & UI Improvements

## ✅ Hoàn thành

### 1. Database Migration - Customers Table
**Vấn đề**: Bảng `customers` không có cột `id`, dùng `phone` làm PRIMARY KEY
**Giải pháp**: Migrate sang structure mới

**Trước**:
```sql
CREATE TABLE customers (
    phone TEXT PRIMARY KEY,  -- ❌ Khó liên kết
    ...
)
```

**Sau**:
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ✅ Dễ liên kết
    phone TEXT UNIQUE NOT NULL,
    ...
)
```

### 2. Backfill Customer Transactions ✅
**Script**: `backfill_customer_transactions.js`

Đã backfill **10 đơn hàng cũ** vào `customer_transactions`:
- Tất cả POS orders với khách hàng đã được thêm vào lịch sử
- Type: `'ORDER'`
- Description: `'Đơn hàng #<id>'`

### 3. Nút "Lịch sử bán lẻ" trong POS ✅
**File**: `src/views/pos/index.hbs`

Thêm nút `📋 Lịch sử bán lẻ` ở header:
```html
<div class="page-header">
    <h2>Đơn Bán lẻ</h2>
    <a href="/pos/history" class="btn btn-secondary">📋 Lịch sử bán lẻ</a>
</div>
```

### 4. Chi tiết giao dịch Thu/Chi ✅
**Tính năng mới**: Xem chi tiết custom transactions

**Routes**:
- `GET /reports/transaction/:id` - Xem chi tiết giao dịch

**Files**:
- `src/routes/reports.js` - Thêm route
- `src/controllers/reportController.js` - Method `showTransaction`
- `src/views/reports/transaction_detail.hbs` - View chi tiết

**Hiển thị**:
- ✅ Loại giao dịch (Thu/Chi)
- ✅ Tên giao dịch
- ✅ Số tiền (với màu xanh/đỏ)
- ✅ Hình thức thanh toán
- ✅ Ngày giao dịch
- ✅ Khách hàng (nếu có) - có link
- ✅ Mô tả & Ghi chú

### 5. Customer Transaction History Links ✅
**File**: `src/views/customers/show.hbs`

Cập nhật links "Xem":
- ORDER → `/pos/:id`
- WORKSHOP → `/workshop/:id`
- INCOME/EXPENSE → `/reports/transaction/:id` ✅ (trước đây link tới `/reports`)

## Database Relationships

### customer_transactions Table
```sql
CREATE TABLE customer_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,        -- FK → customers(id)
    transaction_id INTEGER,              -- FK → orders/transactions/workshop_orders
    type TEXT NOT NULL,                  -- ORDER, WORKSHOP, INCOME, EXPENSE
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME
)
```

### Liên kết tự động

1. **POS Orders** with customer:
   ```javascript
   // orderController.js - store method
   Khi tạo đơn → lưu vào customer_transactions (type: ORDER)
   ```

2. **Custom Transactions** with customer:
   ```javascript
   // reportController.js - createTransaction
   Khi tạo giao dịch → lưu vào customer_transactions (type: INCOME/EXPENSE)
   ```

3. **Workshop** (TODO):
   - Cần update workshop controller
   - Type: WORKSHOP

## Data Flow

### Khi tạo đơn POS với khách hàng:
1. Lưu vào `orders` table
2. Lấy `customer.id` từ `phone`
3. Tự động tạo record trong `customer_transactions`
4. → Hiện trong lịch sử giao dịch của khách

### Khi tạo giao dịch Thu/Chi trong Reports:
1. Lưu vào `transactions` table
2. Nếu chọn khách hàng → lưu vào `customer_transactions`
3. → Hiện trong lịch sử giao dịch của khách
4. → Click "Xem" → Xem chi tiết tại `/reports/transaction/:id`

## Testing Checklist

✅ Customers có `id` column
✅ 10 đơn hàng cũ đã trong `customer_transactions`
✅ POS có nút "Lịch sử bán lẻ"
✅ Tạo đơn POS với KH → Xuất hiện trong lịch sử KH
✅ Tạo giao dịch Thu/Chi với KH → Xuất hiện trong lịch sử KH
✅ Click "Xem" từ lịch sử KH → Mở đúng trang chi tiết
✅ Trang chi tiết transaction hiển thị đầy đủ thông tin

## Còn lại

⚠️ **POS Confirmation Modal**: Chưa làm
   - Cần thêm modal confirmation
   - Hiển thị payment method
   - Custom success message (không dùng alert)

⚠️ **Workshop**: Chưa lưu vào customer_transactions
   - Cần update workshopController
   - Khi thanh toán → lưu vào customer_transactions

---

**Server**: http://localhost:3000
**Status**: Running ✅
