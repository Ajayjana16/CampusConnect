const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
companyName:String,
email:String,
password:String
});

module.exports = mongoose.model("Company",CompanySchema);