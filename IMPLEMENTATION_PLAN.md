# Implementation Plan for Payment Methods & Salary Management

## Database Changes ✅ COMPLETE
- Added `payment_method` to: orders, workshop_payments, salaries, transactions
- Added `default_salary` to users (default: 5,000,000 VND)
- Added `bonus` and `penalty` to salaries
- Added `customer_phone`, `transaction_date`, `note` to transactions
- Set default salary for existing staff to 5,000,000 VND

## Remaining Implementation Tasks

### 1. Payment Method in POS Orders
**Files to modify:**
- `src/views/pos/index.hbs` - Add payment method dropdown
- `src/controllers/orderController.js` - Handle payment_method in create
- `src/models/orderModel.js` - Update create to include payment_method

### 2. Payment Method in Workshop Payments
**Files to modify:**
- `src/views/workshop/show.hbs` - Add payment method dropdown
- `src/controllers/workshopController.js` - Handle payment_method in addPayment
- `src/models/workshopModel.js` - Update addPayment to include payment_method

### 3. Reports - Create Transaction Button
**Files to modify:**
- `src/views/reports/index.hbs` - Add "Tạo giao dịch" button & modal
- `src/controllers/reportController.js` - Add createTransaction method
- `src/routes/reports.js` - Add POST /reports/transaction route
- `src/models/transactionModel.js` - Update create to include new fields

### 4. Reports - Payment Method Summary
**Files to modify:**
- `src/controllers/reportController.js` - Calculate cash/transfer totals
- `src/views/reports/index.hbs` - Display cash/transfer breakdown

### 5. Reports - Revenue/Expense Filters
**Files to modify:**
- `src/views/reports/index.hbs` - Add filter dropdowns for:
  - Chi tiết thu: "Tất cả", "Đơn lẻ", "Đơn xưởng", "Khác"
  - Chi tiết chi: "Tất cả", "Nhập hàng", "Trả lương", "Khác"
- Add JavaScript to filter tables client-side

### 6. Reports - View Order Links
**Files to modify:**
- `src/views/reports/index.hbs` - Add links to view orders/transactions

### 7. Salary Slip Creation Page
**Files to create:**
- `src/views/users/create_salary_slip.hbs` - New page like workshop create
- `src/controllers/userController.js` - Add createSalarySlipForm, storeSalarySlip methods
- `src/routes/users.js` - Add routes for salary slip creation
- `src/models/userModel.js` - Add batch salary creation method

### 8. Employee Default Salary
**Files to modify:**
- `src/views/users/index.hbs` - Add default_salary display & edit
- `src/views/users/edit.hbs` - Add default_salary field
- `src/controllers/userController.js` - Handle default_salary in create/update
- `src/models/userModel.js` - Include default_salary in queries

## Priority Order
1. Payment methods in POS & Workshop (most critical for tracking)
2. Reports payment breakdown & filters
3. Salary slip creation (complex but important)
4. View order links
5. Transaction creation button

## Notes
- All currency inputs need currency-input class
- All forms need to strip commas before submission
- Keep backward compatibility with existing data
