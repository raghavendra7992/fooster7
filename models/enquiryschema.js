const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  course_interest: {
    type: String,
    required: true,
    trim: true,
  },
  // Additional enquiry details (optional)
  phone: { type: String },
  message: { type: String },
  source: { type: String }, // e.g., website, brochure, referral
  submitted_at: { type: Date, default: Date.now },
  claimed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assigned_at: { type: Date }, 
});

// Relationships
enquirySchema.virtual('claimed_counselor', {
  ref: 'User',
  localField: 'claimed_by',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('Enquiry', enquirySchema);
