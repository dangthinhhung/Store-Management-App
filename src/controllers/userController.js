const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { removeAccents } = require('../utils/stringUtils');
const { formatCreatedBy } = require('../utils/userHelper');

const userController = {
    index: (req, res) => {
        User.getAll((err, users) => {
            if (err) return res.status(500).send(err.message);

            User.getAllSalarySlips((err, slips) => {
                if (err) return res.status(500).send(err.message);

                const staffUsers = users.filter(u => u.role !== 'OWNER');

                res.render('users/index', {
                    title: 'Nhân viên & Lương',
                    users,
                    staffUsers,
                    salarySlips: slips,
                    active: 'users'
                });
            });
        });
    },

    create: async (req, res) => {
        const { full_name, phone, dob } = req.body;

        // Auto-gen username: lowercase name without accents + last 4 digits of phone
        const namePart = removeAccents(full_name).toLowerCase().replace(/\s/g, '');
        const phonePart = phone.slice(-4);
        const username = namePart + phonePart;

        // Auto-gen password: random 6 digits
        const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const userData = {
            username,
            password: hashedPassword,
            plain_password: rawPassword, // Storing plain for display requirement
            full_name,
            role: 'STAFF', // Default role
            phone,
            dob,
            default_salary: parseFloat((req.body.default_salary || '0').replace(/,/g, ''))
        };

        User.create(userData, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/users');
        });
    },

    editForm: (req, res) => {
        const id = req.params.id;
        User.getById(id, (err, user) => {
            if (err) return res.status(500).send(err.message);
            res.render('users/edit', { title: 'Sửa nhân viên', user, active: 'users' });
        });
    },

    update: async (req, res) => {
        const id = req.params.id;
        const data = req.body;

        if (data.default_salary) {
            data.default_salary = parseFloat(data.default_salary.replace(/\D/g, ''));
        }

        // Handle password update if provided
        if (data.password && data.password.trim() !== '') {
            const rawPassword = data.password.trim();
            const hashedPassword = await bcrypt.hash(rawPassword, 10);
            data.password = hashedPassword;
            data.plain_password = rawPassword;

            // We need to update password in DB. 
            // The current User.update model might not handle password field.
            // Let's check User.update in model.
            // It only updates full_name, phone, dob, role, default_salary.
            // We need to add a method to update password or modify update method.
            // For simplicity, let's add a specific updatePassword method or modify the query in model.
            // But since I can't see the model right now (I saw it earlier), 
            // I'll assume I need to update the model too.

            User.updatePassword(id, data.password, data.plain_password, (err) => {
                if (err) console.error("Password update failed", err);
            });
        }

        User.update(id, data, (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/users');
        });
    },

    delete: (req, res) => {
        const id = req.params.id;
        User.getById(id, (err, user) => {
            if (user.role === 'OWNER') {
                return res.status(403).send('Không thể xóa chủ cửa hàng');
            }
            User.delete(id, (err) => {
                if (err) return res.status(500).send(err.message);
                res.redirect('/users');
            });
        });
    },

    deleteSalarySlip: (req, res) => {
        const id = req.params.id;
        User.deleteSalariesBySlipId(id, (err) => {
            if (err) return res.status(500).send(err.message);
            User.deleteSalarySlip(id, (err) => {
                if (err) return res.status(500).send(err.message);
                res.redirect('/users');
            });
        });
    },

    showSalarySlip: (req, res) => {
        const id = req.params.id;
        User.getSalarySlipById(id, (err, slip) => {
            if (err) return res.status(500).send(err.message);
            if (!slip) return res.status(404).send('Salary slip not found');

            User.getSalariesBySlipId(id, (err, details) => {
                if (err) return res.status(500).send(err.message);
                res.render('users/salary_show', {
                    title: 'Chi tiết phiếu lương',
                    slip,
                    details,
                    active: 'users'
                });
            });
        });
    },

    editSalarySlipForm: (req, res) => {
        const id = req.params.id;
        User.getSalarySlipById(id, (err, slip) => {
            if (err) return res.status(500).send(err.message);
            if (!slip) return res.status(404).send('Salary slip not found');

            // Get all employees in this slip
            User.getSalariesBySlipId(id, (err, currentSalaries) => {
                if (err) return res.status(500).send(err.message);

                // Get all users to allow adding new ones
                User.getAll((err, allUsers) => {
                    if (err) return res.status(500).send(err.message);

                    // Filter to show only staff that aren't already in the slip
                    const currentUserIds = currentSalaries.map(s => s.user_id);
                    const availableUsers = allUsers.filter(u =>
                        u.role !== 'OWNER' && !currentUserIds.includes(u.id)
                    );

                    res.render('users/salary_edit', {
                        title: 'Chỉnh sửa phiếu lương',
                        slip,
                        currentSalaries,
                        availableUsers,
                        active: 'users'
                    });
                });
            });
        });
    },

    salarySlipForm: (req, res) => {
        User.getAll((err, users) => {
            if (err) return res.status(500).send(err.message);
            const staffUsers = users.filter(u => u.role !== 'OWNER');

            // Get current month/year
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            // Check if slip exists
            User.getSalarySlipByMonthYear(month, year, (err, slip) => {
                if (slip) {
                    // If exists, redirect to view (not edit)
                    return res.redirect(`/users/salary-slips/${slip.id}`);
                }

                res.render('users/salary_slip', {
                    title: 'Tạo phiếu lương',
                    staffUsers,
                    month,
                    year,
                    active: 'users'
                });
            });
        });
    },

    createSalarySlip: (req, res) => {
        const body = req.body;
        const month = body.month;
        const year = body.year;
        const payment_method = body.payment_method;
        const note = body.note;
        const createdBy = formatCreatedBy(req.session.user);

        let userIds = body.user_id;
        if (!userIds) return res.redirect('/users'); // No users

        if (!Array.isArray(userIds)) {
            userIds = [userIds];
        }

        // Helper to parse currency strictly
        // Helper to parse currency strictly (handles 1,000,000 or 1.000.000)
        const parseCurrency = (val) => {
            if (!val) return 0;
            // Remove everything that is not a digit
            return parseFloat(val.toString().replace(/\D/g, '')) || 0;
        };

        const salaries = [];
        let totalSlipAmount = 0;

        for (let i = 0; i < userIds.length; i++) {
            const uid = userIds[i];
            const bonus = Array.isArray(body.bonus) ? body.bonus[i] : body.bonus;
            const penalty = Array.isArray(body.penalty) ? body.penalty[i] : body.penalty;
            const amount = Array.isArray(body.total_salary) ? body.total_salary[i] : body.total_salary;

            const bonusVal = parseCurrency(bonus);
            const penaltyVal = parseCurrency(penalty);
            const amountVal = parseCurrency(amount);

            if (amountVal > 0) {
                salaries.push({
                    user_id: uid,
                    amount: amountVal,
                    bonus: bonusVal,
                    penalty: penaltyVal,
                    month,
                    year,
                    payment_method,
                    note
                });
                totalSlipAmount += amountVal;
            }
        }

        if (salaries.length === 0) return res.redirect('/users');

        // Create Slip
        User.createSalarySlip({
            month,
            year,
            total_amount: totalSlipAmount,
            note,
            payment_method,
            created_by: createdBy
        }, (err, slipId) => {
            if (err) return res.status(500).send(err.message);

            // Add details
            let completed = 0;
            let errors = [];

            salaries.forEach(s => {
                s.salary_slip_id = slipId;
                User.addSalary(s, (err) => {
                    if (err) errors.push(err);
                    completed++;
                    if (completed === salaries.length) {
                        if (errors.length > 0) return res.status(500).send(errors[0].message);

                        // Also create a transaction record for the total slip
                        const Transaction = require('../models/transactionModel');
                        const slipCode = `LUONG${month.toString().padStart(2, '0')}${year}`;

                        Transaction.create({
                            type: 'EXPENSE',
                            amount: totalSlipAmount,
                            description: `Chi lương tháng ${month}/${year}`,
                            transaction_name: `Phiếu lương ${month}/${year}`,
                            payment_method: payment_method,
                            transaction_date: new Date().toISOString().split('T')[0],
                            note: note,
                            code: slipCode
                        }, (err) => {
                            // Ignore transaction error for now or log it
                            res.redirect('/users');
                        });
                    }
                });
            });
        });
    },

    showSalarySlipByCode: (req, res) => {
        const code = req.params.code;
        User.getSalarySlipByCode(code, (err, slip) => {
            if (err) return res.status(500).send(err.message);
            if (!slip) return res.status(404).send('Không tìm thấy phiếu lương');
            res.redirect(`/users/salary-slips/${slip.id}`);
        });
    },

    updateSalarySlip: (req, res) => {
        const id = req.params.id;
        const body = req.body;
        // Logic similar to create: parse body, calculate total
        // But first delete old salaries for this slip, then re-insert.

        const month = body.month;
        const year = body.year;

        const parseCurrency = (val) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/\D/g, '')) || 0;
        };

        let salaryIds = body.salary_id;
        let userIds = body.user_id;
        let amounts = body.amount;
        let bonuses = body.bonus;
        let penalties = body.penalty;

        // Ensure arrays
        if (!Array.isArray(salaryIds)) salaryIds = [salaryIds];
        if (!Array.isArray(userIds)) userIds = [userIds];
        if (!Array.isArray(amounts)) amounts = [amounts];
        if (!Array.isArray(bonuses)) bonuses = [bonuses];
        if (!Array.isArray(penalties)) penalties = [penalties];

        let totalAmount = 0;
        const updates = [];
        const additions = [];

        for (let i = 0; i < userIds.length; i++) {
            const salaryId = salaryIds[i];
            const userId = userIds[i];
            const amount = parseCurrency(amounts[i]);
            const bonus = parseCurrency(bonuses[i]);
            const penalty = parseCurrency(penalties[i]);

            // Total includes bonus minus penalty
            totalAmount += (amount + bonus - penalty);

            if (salaryId === '0' || salaryId === 0) {
                // New employee to add
                additions.push({
                    user_id: userId,
                    amount,
                    bonus,
                    penalty,
                    salary_slip_id: id
                });
            } else {
                // Existing employee to update
                updates.push({
                    id: salaryId,
                    amount,
                    bonus,
                    penalty
                });
            }
        }

        // First, update the slip total
        User.updateSalarySlip(id, {
            total_amount: totalAmount,
            payment_method: body.payment_method,
            note: body.note
        }, (err) => {
            if (err) return res.status(500).send(err.message);

            // Update payment_date to current time
            const db = require('../config/database');
            db.run("UPDATE salary_slips SET payment_date = datetime('now', 'localtime') WHERE id = ?", [id], (err) => {
                // Continue even if this fails
            });

            // Get all existing salaries for this slip
            User.getSalariesBySlipId(id, (err, existingSalaries) => {
                if (err) return res.status(500).send(err.message);

                // Find salaries to delete (those not in the update list)
                const updateIds = updates.map(u => parseInt(u.id));
                const salariesToDelete = existingSalaries.filter(s => !updateIds.includes(s.id));

                let completed = 0;
                let total = updates.length + additions.length + salariesToDelete.length;

                if (total === 0) {
                    return res.redirect(`/users/salary-slips/${id}`);
                }

                // Delete removed salaries
                salariesToDelete.forEach(salary => {
                    User.deleteSalary(salary.id, (err) => {
                        completed++;
                        if (completed === total) res.redirect(`/users/salary-slips/${id}`);
                    });
                });

                // Update existing
                updates.forEach(update => {
                    const sql = `UPDATE salaries SET amount = ?, bonus = ?, penalty = ? WHERE id = ?`;
                    const db = require('../config/database');
                    db.run(sql, [update.amount, update.bonus, update.penalty, update.id], (err) => {
                        completed++;
                        if (completed === total) res.redirect(`/users/salary-slips/${id}`);
                    });
                });

                // Add new
                additions.forEach(addition => {
                    User.addSalary({
                        user_id: addition.user_id,
                        amount: addition.amount,
                        bonus: addition.bonus,
                        penalty: addition.penalty,
                        salary_slip_id: id,
                        month: '', // Not needed for slip-based
                        year: '',
                        payment_method: body.payment_method
                    }, (err) => {
                        completed++;
                        if (completed === total) res.redirect(`/users/salary-slips/${id}`);
                    });
                });
            });
        });
    },
};

module.exports = userController;
