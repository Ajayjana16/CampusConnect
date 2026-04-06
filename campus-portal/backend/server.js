const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const loginRoutes = require("./routes/loginRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

/* Serve frontend */
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
/* API routes */
app.use("/api", loginRoutes);
app.use("/api", jobRoutes);

app.listen(3000,()=>{
console.log("Server running on port 3000");
});
