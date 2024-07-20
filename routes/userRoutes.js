const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, phone, dob, monthlySalary, password } = req.body;

  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  if (age < 20 || monthlySalary < 25000) {
    return res.status(400).json({ message: 'User not eligible' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    phone,
    dob,
    monthlySalary,
    status: 'approved',
    password: hashedPassword,
  });

  try {
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

 // Generate access and refresh tokens
 const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
 const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_REFRESH, { expiresIn: '7d' }); // Set longer expiry for refresh token (e.g., 7 days)

 res.json({ accessToken, refreshToken });
} catch (err) {
 res.status(500).json({ error: err.message });
}
});

// Show User Data
router.get('/user', async (req, res) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      purchasePower: user.purchasePower,
      phone: user.phone,
      email: user.email,
      registrationDate: user.registrationDate,
      dob: user.dob,
      monthlySalary: user.monthlySalary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrow Money
router.post('/borrow', async (req, res) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const { amount } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.purchasePower += amount;

    const interestRate = 0.08;
    const monthlyRepayment = (amount * (1 + interestRate)) / 12;

    await user.save();

    res.json({ purchasePower: user.purchasePower, monthlyRepayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;