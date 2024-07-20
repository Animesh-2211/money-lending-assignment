const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  registrationDate: { type: Date, default: Date.now },
  dob: Date,
  monthlySalary: Number,
  status: String,
  password: String,
  purchasePower: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
