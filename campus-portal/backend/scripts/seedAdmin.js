const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const MONGO_URL = "mongodb://127.0.0.1:27017/campusPortal";
const ADMIN_EMAIL = "admin@campus.com";
const ADMIN_PASSWORD = "admin123";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URL);

    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      existingAdmin.password = ADMIN_PASSWORD;
      await existingAdmin.save();
      console.log(`Admin already existed. Password reset for ${ADMIN_EMAIL}`);
    } else {
      await Admin.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
