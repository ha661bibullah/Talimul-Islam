// models/Otp.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// OTP স্কিমা তৈরি করুন
const OtpSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // 2 মিনিট পর OTP স্বয়ংক্রিয়ভাবে মুছে যাবে
    expires: 120
  },
  attempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Otp', OtpSchema);