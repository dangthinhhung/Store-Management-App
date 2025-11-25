# Test Checklist

## 1. Authentication
- [ ] Login with `admin`/`admin`.
- [ ] Logout works.
- [ ] Accessing protected routes without login redirects to login.

## 2. Employee Management
- [ ] Add new employee (auto-gen username/password).
- [ ] View employee list (toggle password visibility).
- [ ] Edit employee (change name, role).
- [ ] Delete employee (Owner cannot be deleted).

## 3. Customer Management
- [ ] Add new customer.
- [ ] Edit customer.
- [ ] View customer details (Purchase History tab).
- [ ] Search customer (accent-insensitive).

## 4. Product Management
- [ ] Add new product.
- [ ] Edit product (change status Active/Inactive).
- [ ] View product details (Import/Sales History tabs).
- [ ] Search product (accent-insensitive).

## 5. POS (Selling)
- [ ] Search product (by name/code, accent-insensitive).
- [ ] Add product to cart, change quantity.
- [ ] Search customer (by name/phone).
- [ ] Quick add new customer.
- [ ] Apply discount (Percent/Fixed).
- [ ] Payment confirmation popup.
- [ ] Checkout success.

## 6. Reports
- [ ] View Daily report.
- [ ] View Monthly report.
- [ ] View Yearly report.
- [ ] Check revenue calculation (Retail + Workshop + Custom Income).
- [ ] Check expense calculation (Custom Expense).
- [ ] Check profit calculation.

## 7. Custom Transactions
- [ ] Add Income transaction.
- [ ] Add Expense transaction.
- [ ] Verify appearance in Reports.
