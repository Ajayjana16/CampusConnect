const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({

title:String,
eligibility:String,
salary:String,
lastDate:String,
companyName:String

});

module.exports = mongoose.model("Job",JobSchema);
