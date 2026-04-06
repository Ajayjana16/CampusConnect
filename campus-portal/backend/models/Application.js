const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  studentName: String,
  jobId: String,
  jobTitle: String,
  companyName: String
});

module.exports = mongoose.model("Application", ApplicationSchema);
