const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Company = require("../models/Company");
const Admin = require("../models/Admin");

router.post("/login", async (req, res) => {

  try {

    const role = req.body.role;
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    let user;

    if (role === "student") {
      user = await Student.findOne({ email, password });
    }

    else if (role === "company") {
      user = await Company.findOne({ email, password });
    }

    else if (role === "admin") {
      user = await Admin.findOne({ email, password });
    }

    if (user) {
      res.json({
        success: true,
        name: user.name || user.companyName || "Admin",
        email: user.email || ""
      });
    } else {
      res.json({ success: false });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }

});
// REGISTER STUDENT
router.post("/register-student", async (req, res) => {
  try {

    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    const existing = await Student.findOne({ email });

    if (existing) {
      return res.status(409).json({ success: false, message: "Student already exists" });
    }

    await Student.create({
      name,
      email,
      password
    });

    res.json({ success: true, message: "Student registered successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error registering student" });
  }
});
// REGISTER COMPANY
router.post("/register-company", async (req, res) => {
  try {

    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    const existing = await Company.findOne({ email });

    if (existing) {
      return res.status(409).json({ success: false, message: "Company already exists" });
    }

    await Company.create({
      companyName: name,
      email,
      password
    });

    res.json({ success: true, message: "Company registered successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Error registering company" });
  }
});

module.exports = router;
