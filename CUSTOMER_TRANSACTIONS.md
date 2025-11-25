# Customer Transaction History - Updates

## ✅ Hoàn thành

### Chức năng mới: Lịch sử giao dịch khách hàng

**Trước đây**: Chỉ hiển thị "Lịch sử mua hàng" (đơn POS)

**Bây giờ**: Hiển thị "Lịch sử giao dịch" với tất cả các loại:
- ✅ **Đơn hàng (ORDER)** - Đơn bán lẻ POS
- ✅ **Xưởng (WORKSHOP)** - Đơn xưởng sửa chữa  
- ✅ **Thu (INCOME)** - Giao dịch thu từ khách hàng
- ✅ **Chi (EXPENSE)** - Giao dịch chi cho khách hàng

## Chi tiết cập nhật

### 1. Customer Model
**File**: `src/models/customerModel.js`

Thêm method mới:
```javascript
getTransactionHistory(customerId, callback)
```
- Query từ bảng `customer_transactions`
- JOIN với `orders` và `workshop_orders` để lấy thông tin chi tiết
- Sắp xếp theo thời gian (mới nhất trước)

### 2. Customer Controller  
**File**: `src/controllers/customerController.js`

Cập nhật method `show`:
- Thay `getPurchaseHistory` → `getTransactionHistory`
- Truyền `customer.id` thay vì `phone`
- Truyền `transactions` vào view thay vì `orders`

### 3. Customer View
**File**: `src/views/customers/show.hbs`

Thay đổi giao diện:
- Tiêu đề: "Lịch sử mua hàng" → "Lịch sử giao dịch"
- Cột mới:
  - **Ngày**: Ngày giao dịch
  - **Loại**: Badge màu cho từng loại (ORDER/WORKSHOP/INCOME/EXPENSE)
  - **Mô tả**: Nội dung giao dịch
  - **Số tiền**: 
    - `+` màu xanh cho Thu
    - `-` màu đỏ cho Chi
  - **Chi tiết**: Link xem đơn hàng gốc

Badges:
- 🔵 **Đơn hàng** (ORDER) - Màu xanh dương
- 🟡 **Xưởng** (WORKSHOP) - Màu vàng  
- 🟢 **Thu** (INCOME) - Màu xanh lá
- 🔴 **Chi** (EXPENSE) - Màu đỏ

### 4. Order Controller
**File**: `src/controllers/orderController.js`

Thêm logic lưu customer transaction:
- Khi tạo đơn POS với khách hàng
- Tự động lưu vào `customer_transactions`
- Type: `'ORDER'`
- Description: `'Đơn hàng #<id>'`

## View Links

Mỗi giao dịch có link "Xem" để xem chi tiết:
- **ORDER** → `/pos/:id` - Xem chi tiết đơn hàng
- **WORKSHOP** → `/workshop/:id` - Xem chi tiết đơn xưởng
- **INCOME/EXPENSE** → `/reports` - Xem báo cáo (nếu có transaction_id)

## Database Structure

Bảng `customer_transactions`:
```sql
CREATE TABLE customer_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_id INTEGER,
    type TEXT NOT NULL,  -- ORDER, WORKSHOP, INCOME, EXPENSE
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Các giao dịch được lưu tự động

1. **POS Orders** ✅
   - Khi tạo đơn hàng với khách hàng
   - Type: ORDER
   - Lưu khi đơn hoàn thành

2. **Custom Transactions** ✅  
   - Khi tạo giao dịch trong Reports
   - Chọn khách hàng
   - Type: INCOME hoặc EXPENSE

3. **Workshop Orders** 🔜  
   - Cần cập nhật workshop controller
   - Type: WORKSHOP
   - Lưu khi thanh toán workshop

## Testing Checklist

✅ Xem chi tiết khách hàng → Hiển thị "Lịch sử giao dịch"
✅ Tạo đơn POS với khách hàng → Xuất hiện trong lịch sử
✅ Tạo giao dịch Thu/Chi với khách hàng → Xuất hiện trong lịch sử
✅ Click "Xem" → Link đúng đến đơn hàng gốc
✅ Hiển thị đúng màu sắc cho Thu (+xanh) và Chi (-đỏ)
✅ Badge hiển thị đúng loại giao dịch

## Cần làm thêm

⚠️ **Workshop Orders**: Cập nhật workshop controller để lưu vào customer_transactions khi thanh toán

---

**Status**: Hoàn thành chính
**Server**: http://localhost:3000
**Next**: Cập nhật workshop payments
