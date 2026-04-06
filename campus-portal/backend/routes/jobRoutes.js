const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Feedback = require("../models/Feedback");
const Application = require("../models/Application");

router.post("/add-student", async (req,res)=>{
const student = new Student(req.body);
await student.save();
res.json({message:"Student Added"});
});

router.get("/students", async (req,res)=>{
const students = await Student.find().select("-password");
res.json(students);
});

router.put("/update-student/:id", async (req, res) => {
try{

const name = (req.body.name || "").trim();
const email = (req.body.email || "").trim().toLowerCase();

if(!name || !email){
return res.status(400).json({ message: "Name and email are required" });
}

const existingStudent = await Student.findOne({
email,
_id: { $ne: req.params.id }
});

if(existingStudent){
return res.status(400).json({ message: "Another student already uses this email" });
}

const currentStudent = await Student.findById(req.params.id);

if(!currentStudent){
return res.status(404).json({ message: "Student not found" });
}

const previousName = currentStudent.name;

currentStudent.name = name;
currentStudent.email = email;

await currentStudent.save();

if(previousName !== name){

await Promise.allSettled([
Application.updateMany(
{ studentName: previousName },
{ $set: { studentName: name } }
),

Feedback.updateMany(
{ studentName: previousName },
{ $set: { studentName: name } }
)
]);
}

res.json({ message: "Student updated successfully" });

}
catch(error){
console.log(error);
res.status(500).json({ message: error.message || "Error updating student" });
}
});

router.put("/student-profile", async (req, res) => {
try{

const currentEmail = (req.body.currentEmail || "").trim().toLowerCase();
const name = (req.body.name || "").trim();

if(!currentEmail || !name){
return res.status(400).json({ message: "Current email and name are required" });
}

const student = await Student.findOne({ email: currentEmail });

if(!student){
return res.status(404).json({ message: "Student not found" });
}

const previousName = student.name;

student.name = name;
await student.save();

if(previousName !== name){
await Promise.allSettled([
Application.updateMany(
{ studentName: previousName },
{ $set: { studentName: name } }
),
Feedback.updateMany(
{ studentName: previousName },
{ $set: { studentName: name } }
)
]);
}

res.json({
message: "Profile updated successfully",
student: {
name: student.name,
email: student.email
}
});

}
catch(error){
res.status(500).json({ message: error.message || "Error updating profile" });
}
});

router.put("/update-student-password/:id", async (req, res) => {
try{

const password = (req.body.password || "").trim();

if(!password){
return res.status(400).json({ message: "A new password is required" });
}

const student = await Student.findById(req.params.id);

if(!student){
return res.status(404).json({ message: "Student not found" });
}

student.password = password;
await student.save();

res.json({ message: "Student password updated successfully" });

}
catch(error){
res.status(500).json({ message: error.message || "Error updating student password" });
}
});

router.delete("/delete-student/:id", async (req,res)=>{
try{
const student = await Student.findById(req.params.id);

if(!student){
return res.status(404).json({ message: "Student not found" });
}

await Promise.all([
Application.deleteMany({ studentName: student.name }),
Feedback.deleteMany({ studentName: student.name }),
Student.findByIdAndDelete(req.params.id)
]);

res.json({message:"Student deleted successfully"});
}
catch(error){
res.status(500).json({ message: "Error deleting student" });
}
});

router.post("/post-job", async (req, res) => {
try{

const title = (req.body.title || "").trim();
const eligibility = (req.body.eligibility || "").trim();
const salary = (req.body.salary || "").trim();
const lastDate = (req.body.lastDate || "").trim();
const companyName = (req.body.companyName || "").trim();

if(!title || !eligibility || !salary || !lastDate || !companyName){
return res.status(400).json({ message: "Title, eligibility, salary, last date, and company name are required" });
}

await Job.create({
title,
eligibility,
salary,
lastDate,
companyName
});

res.json({ message: "Job posted successfully" });

}
catch(error){
res.status(500).json({ message: "Error posting job" });
}
});

router.put("/update-job/:id", async (req, res) => {
try{

const title = (req.body.title || "").trim();
const eligibility = (req.body.eligibility || "").trim();
const salary = (req.body.salary || "").trim();
const lastDate = (req.body.lastDate || "").trim();

if(!title || !eligibility || !salary || !lastDate){
return res.status(400).json({ message: "Title, eligibility, salary, and last date are required" });
}

const job = await Job.findById(req.params.id);

if(!job){
return res.status(404).json({ message: "Job not found" });
}

const previousTitle = job.title;

job.title = title;
job.eligibility = eligibility;
job.salary = salary;
job.lastDate = lastDate;

await job.save();

if(previousTitle !== title){
await Application.updateMany(
{ jobId: job._id.toString() },
{ $set: { jobTitle: title, companyName: job.companyName || "" } }
);
}

res.json({ message: "Job updated successfully" });

}
catch(error){
res.status(500).json({ message: "Error updating job" });
}
});

router.post("/apply-job", async (req, res) => {
try {
const studentName = (req.body.studentName || "").trim();
const jobId = (req.body.jobId || "").trim();

if (!studentName || !jobId) {
return res.status(400).json({ message: "Student name and job are required" });
}

const job = await Job.findById(jobId);

if (!job) {
return res.status(404).json({ message: "Job not found" });
}

const existing = await Application.findOne({
studentName,
jobId
});

if (existing) {
return res.json({ message: "You already applied for this job" });
}

await Application.create({
studentName,
jobId,
jobTitle: job.title,
companyName: job.companyName || ""
});

res.json({ message: "Applied successfully" });

} catch (err) {
res.status(500).json({ message: "Error applying job" });
}
});

router.get("/jobs", async (req,res)=>{

try{

const companyName = (req.query.companyName || "").trim();
const query = {};

if(companyName){
query.companyName = companyName;
}

const jobs = await Job.find(query);

res.json(jobs);

}

catch(error){
res.status(500).json({message:"Server Error"});
}

});

router.get("/admin-stats", async (req,res)=>{

try{

const totalStudents = await Student.countDocuments();
const totalCompanies = await Company.countDocuments();
const activeJobs = await Job.countDocuments();

res.json({
students: totalStudents,
companies: totalCompanies,
jobs: activeJobs
});

}

catch(error){
res.status(500).json({message:"Server Error"});
}

});

router.delete("/delete-job/:id", async (req, res) => {
try {
const job = await Job.findById(req.params.id);

if (!job) {
return res.status(404).json({ message: "Job not found" });
}

await Promise.all([
Application.deleteMany({ jobId: req.params.id }),
Job.findByIdAndDelete(req.params.id)
]);

res.json({ message: "Job removed successfully" });

} catch (err) {
res.status(500).json({ message: "Error deleting job" });
}
});

router.get("/get-applications", async (req, res) => {
try {
const studentName = (req.query.studentName || "").trim();
const companyName = (req.query.companyName || "").trim();
const query = {};

if (studentName) {
query.studentName = studentName;
}

if (companyName) {
query.companyName = companyName;
}

const data = await Application.find(query);

res.json(data);

} catch (err) {
res.status(500).json({ message: "Error fetching applications" });
}
});

router.delete("/delete-application/:id", async (req, res) => {
try {
await Application.findByIdAndDelete(req.params.id);

res.json({ message: "Application removed successfully" });

} catch (err) {
res.status(500).json({ message: "Error deleting application" });
}
});

router.get("/companies", async (req, res) => {
try {
const data = await Company.find().select("-password");

res.json(data);

} catch (err) {
res.status(500).json({ message: "Error fetching companies" });
}
});

router.put("/update-company/:id", async (req, res) => {
try {
const companyName = (req.body.companyName || "").trim();
const email = (req.body.email || "").trim().toLowerCase();

    if (!companyName || !email) {
      return res.status(400).json({ message: "Company name and email are required" });
    }

const existingCompany = await Company.findOne({
email,
_id: { $ne: req.params.id }
});

if (existingCompany) {
return res.status(400).json({ message: "Another company already uses this email" });
}

const currentCompany = await Company.findById(req.params.id);

if (!currentCompany) {
return res.status(404).json({ message: "Company not found" });
}

const previousCompanyName = currentCompany.companyName;

    const updatePayload = {
      companyName,
      email
    };

    await Company.findByIdAndUpdate(req.params.id, updatePayload);

if (previousCompanyName !== companyName) {
await Promise.all([
Job.updateMany(
{ companyName: previousCompanyName },
{ $set: { companyName } }
),
Application.updateMany(
{ companyName: previousCompanyName },
{ $set: { companyName } }
)
]);
}

res.json({ message: "Company updated successfully" });

} catch (err) {
res.status(500).json({ message: "Error updating company" });
}
});

router.put("/update-company-password/:id", async (req, res) => {
try {
const password = (req.body.password || "").trim();

if (!password) {
return res.status(400).json({ message: "A new password is required" });
}

const company = await Company.findById(req.params.id);

if (!company) {
return res.status(404).json({ message: "Company not found" });
}

company.password = password;
await company.save();

res.json({ message: "Company password updated successfully" });

} catch (err) {
res.status(500).json({ message: err.message || "Error updating company password" });
}
});

router.delete("/delete-company/:id", async (req, res) => {
try {
const company = await Company.findById(req.params.id);

if (!company) {
return res.status(404).json({ message: "Company not found" });
}

const jobs = await Job.find({ companyName: company.companyName }, "_id");
const jobIds = jobs.map((job) => job._id.toString());

await Promise.all([
Company.findByIdAndDelete(req.params.id),
Job.deleteMany({ companyName: company.companyName }),
Application.deleteMany({
$or: [
{ companyName: company.companyName },
{ jobId: { $in: jobIds } }
]
})
]);

res.json({ message: "Company removed successfully" });

} catch (err) {
res.status(500).json({ message: "Error deleting company" });
}
});

router.post("/submit-feedback", async (req, res) => {
try {
const { studentName, rating, comment } = req.body;

await Feedback.create({
studentName,
rating,
comment
});

res.json({ message: "Feedback submitted successfully" });

} catch (err) {
res.status(500).json({ message: "Error submitting feedback" });
}
});

router.get("/feedback", async (req, res) => {
try {
const { studentName } = req.query;
const query = {};

if (studentName) {
query.studentName = studentName;
}

const data = await Feedback.find(query).sort({ createdAt: -1 });

res.json(data);

} catch (err) {
res.status(500).json({ message: "Error fetching feedback" });
}
});

module.exports = router;
