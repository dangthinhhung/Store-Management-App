# Back Navigation & Transaction Links

## ✅ Hoàn thành

### Vấn đề đã sửa:

1. **Back Navigation** ✅
   - Khi xem chi tiết từ bất kỳ trang nào → Back quay về đúng trang đó
   - Sử dụng query parameter `?back=<url>`
   - Fallback về trang mặc định nếu không có `back` parameter

2. **Transaction Detail Links** ✅
   - Tất cả custom transactions (INCOME/EXPENSE) giờ có link "Xem"
   - Link đến `/reports/transaction/:id` với back parameter

## Implementation Details

### Back Navigation System

**Query Parameter**: `?back=<url>`

Ví dụ:
```
/pos/123?back=/customers/0123456789
/workshop/45?back=/reports  
/reports/transaction/7?back=/customers/0123456789
```

### Updated Pages

#### 1. Detail Pages (với goBack function)

**Files**:
- `src/views/pos/show.hbs`
- `src/views/workshop/show.hbs`
- `src/views/reports/transaction_detail.hbs`

**Script thêm vào**:
```javascript
function goBack(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const backUrl = urlParams.get('back');
    if (backUrl) {
        window.location.href = backUrl;
    } else {
        window.location.href = '/default-page'; // Fallback
    }
}
```

**Fallback URLs**:
- POS → `/pos/history`
- Workshop → `/workshop`
- Transaction → `/reports`

#### 2. Link Sources (với back parameter)

**Customer Transaction History** (`customers/show.hbs`):
```handlebars
<a href="/pos/{{transaction_id}}?back=/customers/{{customer.phone}}">Xem</a>
<a href="/workshop/{{transaction_id}}?back=/customers/{{customer.phone}}">Xem</a>
<a href="/reports/transaction/{{transaction_id}}?back=/customers/{{customer.phone}}">Xem</a>
```

**Reports Index** (`reports/index.hbs`):
```handlebars
<!-- Revenue -->
<a href="/pos/{{id}}?back=/reports">Xem</a>
<a href="/workshop/{{workshop_order_id}}?back=/reports">Xem</a>
<a href="/reports/transaction/{{id}}?back=/reports">Xem</a> ✅ NEW

<!-- Expense -->
<a href="/imports?back=/reports">Xem</a>
<a href="/reports/transaction/{{id}}?back=/reports">Xem</a> ✅ NEW
<a href="/users">Xem</a> (Salaries)
```

## Navigation Flow Examples

### Example 1: Từ Customer History
```
1. Khách hàng → /customers/0123456789
2. Click "Xem" trên ORDER #123 
   → /pos/123?back=/customers/0123456789
3. Click "Quay lại"
   → /customers/0123456789 ✅
```

### Example 2: Từ Reports
```
1. Reports → /reports
2. Click "Xem" trên custom transaction #7
   → /reports/transaction/7?back=/reports
3. Click "Quay lại"
   → /reports ✅
```

### Example 3: Direct Link (không có back)
```
1. Direct URL → /pos/123
2. Click "Quay lại"
   → /pos/history (fallback) ✅
```

## Views Updated

### Links WITH back parameter:
- ✅ Customer transaction history → All detail pages
- ✅ Reports revenue → POS, Workshop, Custom transactions
- ✅ Reports expense → Imports, Custom transactions

### Detail Pages WITH goBack():
- ✅ POS order detail
- ✅ Workshop order detail
- ✅ Custom transaction detail

## Testing Checklist

✅ From customer history:
  - Click ORDER "Xem" → Back returns to customer page
  - Click WORKSHOP "Xem" → Back returns to customer page
  - Click TRANSACTION "Xem" → Back returns to customer page

✅ From reports:
  - Click revenue "Xem" → Back returns to reports
  - Click expense "Xem" → Back returns to reports
  - Click custom transaction "Xem" → Back works

✅ Direct access:
  - /pos/123 → Back goes to /pos/history
  - /workshop/45 → Back goes to /workshop
  - /reports/transaction/7 → Back goes to /reports

## Notes

- Tất cả custom transactions (INCOME/EXPENSE) giờ có thể xem chi tiết
- Back navigation thông minh - nhớ trang gọi
- Fallback default nếu access trực tiếp
- Không cần modal - simple và clean

---

**Status**: ✅ Hoàn thành
**Server**: http://localhost:3000
**Ready for**: Testing
