# Store Management App (ManageApp)

Ứng dụng quản lý cửa hàng điện tử, hỗ trợ bán hàng (POS), quản lý kho, sửa chữa và báo cáo.

## Tính năng chính

### 1. Bán hàng (POS)
- Giao diện bán hàng tối ưu, hỗ trợ tìm kiếm sản phẩm và khách hàng nhanh chóng (không dấu).
- Thêm nhanh khách hàng mới ngay tại màn hình bán hàng.
- Hỗ trợ chiết khấu (theo % hoặc số tiền cố định).
- In hóa đơn (tùy chọn).

### 2. Quản lý Sản phẩm
- Quản lý thông tin sản phẩm, giá bán, giá nhập, tồn kho.
- Theo dõi lịch sử nhập hàng và lịch sử bán hàng chi tiết.
- Trạng thái sản phẩm (Đang bán / Ngừng bán).

### 3. Quản lý Khách hàng
- Quản lý thông tin khách hàng, lịch sử mua hàng.
- Tìm kiếm khách hàng bằng tên hoặc số điện thoại.

### 4. Quản lý Nhân viên
- Phân quyền: Chủ cửa hàng (Owner) và Nhân viên (Staff).
- Tự động tạo tài khoản cho nhân viên mới.
- Tính lương nhân viên (không áp dụng cho chủ cửa hàng).

### 5. Dịch vụ Sửa chữa
- Tiếp nhận và quản lý đơn sửa chữa.
- Theo dõi trạng thái sửa chữa, linh kiện thay thế.

### 6. Báo cáo
- Báo cáo doanh thu, chi phí, lợi nhuận theo Ngày, Tháng, Năm.
- Theo dõi thu chi ngoài (tiền điện, nước, v.v.).

## Cài đặt và Chạy ứng dụng

1. **Yêu cầu:** Node.js đã được cài đặt.
2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
### 2. Cài đặt Cơ sở dữ liệu
Dự án sử dụng SQLite. Để khởi tạo lại cơ sở dữ liệu với schema mới nhất (Lưu ý: sẽ xóa hết dữ liệu cũ):

```bash
node src/utils/rebuild_db.js
```

Script này sẽ tạo file `data/store.db` và tạo tài khoản admin mặc định.

### 3. Tài khoản Mặc định
- **Username**: `admin`
- **Password**: `admin`

## Cấu trúc dự án
- `src/`: Mã nguồn chính (Controllers, Models, Routes, Views).
- `public/`: Tài nguyên tĩnh (CSS, JS, Images).
- `database.sqlite`: Cơ sở dữ liệu SQLite.
```
