const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  studentName: String,
  rating: Number,
  comment: String
}, {
  timestamps: true
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
