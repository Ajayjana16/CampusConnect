console.log("Script Loaded");

let selectedFeedbackRating = 0;
let studentJobsRefreshTimer = null;

/* ================= LOGIN ================= */

async function login(){

let role = document.getElementById("role").value;
let email = document.getElementById("email").value.trim().toLowerCase();
let password = document.getElementById("password").value.trim();

try{

let response = await fetch("/api/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
role,
email,
password
})
});

let data = await response.json();

if(data.success){

localStorage.setItem("role", role);

if(role === "admin"){
window.location.href = "admin-dashboard.html";
}

else if(role === "company"){
localStorage.setItem("companyName", data.name || email.split("@")[0]);
window.location.href = "company-dashboard.html";
}

else if(role === "student"){
localStorage.setItem("studentName", data.name || email.split("@")[0]);
localStorage.setItem("studentEmail", data.email || email);
window.location.href = "student-dashboard.html";
}

}
else{
alert("Invalid Login");
}

}
catch(err){
alert("Server Error");
}

}


/* ================= SIGNUP ================= */

function signup(){

let role = document.getElementById("role").value;
let name = document.getElementById("name").value;
let email = document.getElementById("email").value.trim().toLowerCase();
let password = document.getElementById("password").value.trim();

/* VALIDATION */
if(!name || !email || !password){
alert("Please fill all fields");
return;
}

let url = role === "student"
? "/api/register-student"
: "/api/register-company";

fetch(url,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name,
email,
password
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Signup failed");
}

return data;
})
.then(data=>{
alert(data.message);
window.location.href = "login.html";
})
.catch(err=>{
alert(err.message || "Signup failed");
});

}


/* ================= POST JOB ================= */

function postJob(){

let title = document.getElementById("title").value;
let eligibility = document.getElementById("eligibility").value;
let salary = document.getElementById("salary").value;
let lastDate = document.getElementById("lastDate").value;
let companyName = localStorage.getItem("companyName") || "";

fetch("/api/post-job",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
title,
eligibility,
salary,
lastDate,
companyName
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Error posting job");
}

return data;
})
.then(data=>{
alert(data.message);

let titleField = document.getElementById("title");
let eligibilityField = document.getElementById("eligibility");
let salaryField = document.getElementById("salary");
let lastDateField = document.getElementById("lastDate");

if(titleField) titleField.value="";
if(eligibilityField) eligibilityField.value="";
if(salaryField) salaryField.value="";
if(lastDateField) lastDateField.value="";

loadCompanyOverviewStats();

if(document.getElementById("adminJobTable")){
loadAdminJobsManagement();
}
})
.catch((error)=>{
alert(error.message || "Error posting job");
});

}


/* ================= LOAD JOBS ================= */

function loadJobs(){

let studentName = localStorage.getItem("studentName") || "Student";
let container = document.getElementById("studentJobList");
let jobsCount = document.getElementById("studentJobCount");
let jobsCountBanner = document.getElementById("studentJobCountBanner");

if(container){
container.innerHTML = `<div class="job-card empty-state-card"><h3>Loading opportunities...</h3><p>We are gathering the latest openings for you now.</p></div>`;
}

fetch("/api/jobs")
.then(res=>res.json())
.then(jobs=>{

return fetch(`/api/get-applications?studentName=${encodeURIComponent(studentName)}`)
.then(res=>res.json())
.then(applications=>({ jobs, applications }));
})
.then(({ jobs, applications })=>{

let jobsHTML="";
let appliedJobIds = new Set(applications.map(app => app.jobId));

jobs.forEach(job=>{

let isApplied = appliedJobIds.has(job._id);
let buttonHtml = isApplied
? `<button disabled>Applied</button>`
: `<button onclick="applyJob('${job._id}')">Apply</button>`;

jobsHTML += `
<div class="job-card">
<h3>${job.title}</h3>
<p>Eligibility: ${job.eligibility}</p>
<p>Salary: ${job.salary}</p>
<p>Last Date: ${job.lastDate}</p>
${buttonHtml}
</div>
`;

});

if(!jobs.length){
jobsHTML = `
<div class="job-card empty-state-card">
<h3>No jobs available right now</h3>
<p>Check back soon for new opportunities from registered companies.</p>
</div>
`;
}

if(container){
container.innerHTML = jobsHTML;
}

if(jobsCount){
jobsCount.innerText = jobs.length;
}

if(jobsCountBanner){
jobsCountBanner.innerText = jobs.length;
}

})
.catch(()=>{
if(container){
container.innerHTML = `
<div class="job-card empty-state-card">
<h3>Unable to load jobs</h3>
<p>Please refresh the page or try again in a moment.</p>
</div>
`;
}

if(jobsCount){
jobsCount.innerText = "0";
}

if(jobsCountBanner){
jobsCountBanner.innerText = "0";
}
});

}

if(document.getElementById("studentJobList")){
loadJobs();

if(!studentJobsRefreshTimer){
studentJobsRefreshTimer = setInterval(() => {
if(document.getElementById("studentJobList")){
loadJobs();
}
}, 5000);
}
}


/* ================= APPLY JOB ================= */

function applyJob(jobId){

let studentName = localStorage.getItem("studentName") || "Student";

fetch("/api/apply-job",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
studentName,
 jobId
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Error applying job");
}

return data;
})
.then(data=>{
alert(data.message);
loadJobs();
})
.catch((error)=>{
alert(error.message || "Error applying job");
});

}


/* ================= APPLIED JOBS ================= */

function loadAppliedJobs(){

let studentName = localStorage.getItem("studentName") || "Student";
let container = document.getElementById("appliedJobs");

if(!container){
return;
}

fetch(`/api/get-applications?studentName=${encodeURIComponent(studentName)}`)
.then(res=>res.json())
.then(data=>{

let html = "";

if(!data.length){
container.innerHTML = `<div class="job-card empty-state-card"><h3>No applications yet</h3><p>You have not applied to any jobs so far.</p></div>`;
return;
}

data.forEach(app=>{
html += `
<div class="job-card">
<h3>${app.jobTitle}</h3>
<p>Applied by: ${app.studentName}</p>
</div>
`;
});

container.innerHTML = html;

})
.catch(()=>{
container.innerHTML = `<div class="job-card empty-state-card"><h3>Unable to load applications</h3><p>Please try again in a moment.</p></div>`;
});

}


/* ================= ADMIN STATS ================= */

function loadAdminStats(){

let notice = document.getElementById("adminDashboardNotice");
let role = localStorage.getItem("role") || "";

if(notice){
notice.innerHTML = role === "admin"
? ""
: `<div class="job-card empty-state-card"><h3>Admin session not confirmed</h3><p>This page is visible, but you should log in as an admin before treating these controls as trusted.</p></div>`;
}

fetch("/api/admin-stats")
.then(res=>res.json())
.then(data=>{

let totalStudentsBanner = document.getElementById("totalStudentsBanner");
let totalCompaniesBanner = document.getElementById("totalCompaniesBanner");
let activeJobsBanner = document.getElementById("activeJobsBanner");

if(totalStudentsBanner){
totalStudentsBanner.innerText = data.students;
}

if(totalCompaniesBanner){
totalCompaniesBanner.innerText = data.companies;
}

if(activeJobsBanner){
activeJobsBanner.innerText = data.jobs;
}

})
.catch(()=>{
let totalStudentsBanner = document.getElementById("totalStudentsBanner");
let totalCompaniesBanner = document.getElementById("totalCompaniesBanner");
let activeJobsBanner = document.getElementById("activeJobsBanner");

[totalStudentsBanner, totalCompaniesBanner, activeJobsBanner].forEach((node) => {
if(node){
node.innerText = "0";
}
});

if(notice){
notice.innerHTML = `<div class="job-card empty-state-card"><h3>Unable to load admin statistics</h3><p>The dashboard is currently showing fallback values. Please refresh the page or try again shortly.</p></div>`;
}
});

}


/* ================= STUDENTS ================= */

function addStudent(){

let name = document.getElementById("studentName").value;
let regId = document.getElementById("regId").value;

fetch("/api/add-student",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name,
regId
})
})
.then(res=>res.json())
.then(data=>{
alert(data.message);
displayStudents();
});

}

function displayStudents(){

fetch("/api/students")
.then(res=>res.json())
.then(data=>{

let tableBody = document.getElementById("studentTable");

if(!tableBody){
return;
}

let table = "";

data.forEach(student => {

table += `
<tr>
<td>${getStudentDisplayName(student)}</td>
<td>${student.email || "-"}</td>
<td>
<button onclick="deleteStudent('${student._id}')">Delete</button>
</td>
</tr>
`;

});

tableBody.innerHTML = table;

});

}


/* ================= COMPANY JOBS ================= */

function loadCompanyJobs(){

let companyName = localStorage.getItem("companyName") || "";
let container = document.getElementById("companyJobs");

if(!container){
return;
}

fetch(`/api/jobs?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(data=>{

let html = "";

if(!data.length){
container.innerHTML = `<div class="job-card empty-state-card"><h3>No jobs posted yet</h3><p>Create your first role to start receiving student applications.</p></div>`;
return;
}

data.forEach(job=>{

html += `
<div class="job-card">
<h3>${job.title}</h3>
<p>${job.eligibility}</p>
<p>${job.salary}</p>
<p>${job.lastDate}</p>
<button onclick="deleteJob('${job._id}')">Remove</button>
</div>
`;

});

container.innerHTML = html;

})
.catch(()=>{
container.innerHTML = `<div class="job-card empty-state-card"><h3>Unable to load jobs</h3><p>Please refresh the page or try again shortly.</p></div>`;
});

}

function deleteJob(id){

if(!confirm("Are you sure?")) return;

fetch(`/api/delete-job/${id}`,{
method:"DELETE"
})
.then(res=>res.json())
.then(data=>{
alert(data.message);

if(document.getElementById("companyJobs")){
loadCompanyJobs();
}

loadCompanyOverviewStats();
});

}

function updateJobDetails(id, reloadFn){

let title = document.getElementById(`job-title-${id}`).value;
let eligibility = document.getElementById(`job-eligibility-${id}`).value;
let salary = document.getElementById(`job-salary-${id}`).value;
let lastDate = document.getElementById(`job-lastDate-${id}`).value;

fetch(`/api/update-job/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
title,
eligibility,
salary,
lastDate
})
})
.then(res=>res.json())
.then(data=>{
alert(data.message);

if(reloadFn){
reloadFn();
}
});

}


/* ================= COMPANY APPLICATIONS ================= */

function loadAppliedData(){

let companyName = localStorage.getItem("companyName") || "";
let container = document.getElementById("appliedData");

if(!container){
return;
}

fetch(`/api/get-applications?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(data=>{

let html = "";

if(!data.length){
container.innerHTML = `<div class="job-card empty-state-card"><h3>No applications yet</h3><p>Applications will appear here once students respond to your roles.</p></div>`;
return;
}

data.forEach(app=>{
html += `
<div class="job-card">
<h3>${app.jobTitle}</h3>
<p>Student: ${app.studentName}</p>
</div>
`;
});

container.innerHTML = html;

})
.catch(()=>{
container.innerHTML = `<div class="job-card empty-state-card"><h3>Unable to load applications</h3><p>Please refresh the page or try again shortly.</p></div>`;
});

}


/* ================= COMPANIES ================= */

function loadCompanies(){

fetch("/api/companies")
.then(res=>res.json())
.then(data=>{

let html = "";

data.forEach(company => {
html += `
<tr>
<td>${getCompanyDisplayName(company)}</td>
<td>${company.email}</td>
</tr>
`;
});

let table = document.getElementById("companyTable");

if(table){
table.innerHTML = html;
}

})
.catch(()=>{
let table = document.getElementById("companyTable");

if(table){
table.innerHTML = `<tr><td colspan="2">Unable to load companies</td></tr>`;
}
});

}


/* ================= LOGOUT ================= */

function logout(){
localStorage.clear();
window.location.href = "login.html";
}

function goToPage(page){
window.location.href = page;
}

let roleSelect = document.getElementById("role");
let regInput = document.getElementById("regId");

if(roleSelect && regInput){
roleSelect.addEventListener("change", function(){
regInput.style.display = this.value === "student" ? "block" : "none";
});
}

function getStudentDisplayName(student){
return student.name || "Student";
}

function setStudentName(){

let studentWelcome = document.getElementById("studentWelcome");

if(studentWelcome){
let savedName = localStorage.getItem("studentName") || "Student";
studentWelcome.innerText = `Welcome ${savedName}`;
}

}

async function editStudentName(){

let currentName = localStorage.getItem("studentName") || "Student";
let currentEmail = localStorage.getItem("studentEmail") || "";

if(!currentEmail){
alert("Student session details are missing. Please log in again.");
return;
}

let updatedName = prompt("Enter your updated name", currentName);

if(updatedName === null){
return;
}

updatedName = updatedName.trim();

if(!updatedName){
alert("Name is required");
return;
}

if(updatedName === currentName){
return;
}

try{

let response = await fetch("/api/student-profile",{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
currentEmail,
name: updatedName
})
});

let data = await response.json();

if(!response.ok){
throw new Error(data.message || "Error updating profile");
}

localStorage.setItem("studentName", data.student?.name || updatedName);

if(data.student?.email){
localStorage.setItem("studentEmail", data.student.email);
}

setStudentName();
loadJobs();
alert(data.message || "Profile updated successfully");

}
catch(error){
alert(error.message || "Error updating profile");
}

}

function scrollToJobs(){

let jobsSection = document.getElementById("jobsSection");

if(jobsSection){
jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

}

function getCompanyDisplayName(company){
return company.companyName || company.name || "Company";
}

function setCompanyName(){

let welcomeText = document.getElementById("welcomeText");
let savedName = localStorage.getItem("companyName") || "";
let notice = document.getElementById("companyDashboardNotice");

if(welcomeText){
welcomeText.innerText = savedName
? `Welcome ${savedName}`
: "Welcome Company";
}

if(notice){
notice.innerHTML = savedName
? ""
: `<div class="job-card empty-state-card"><h3>Company session not found</h3><p>Please log in again to load your company-specific dashboard data.</p></div>`;
}

loadCompanyOverviewStats();

}

function loadCompanyOverviewStats(){

let jobsCount = document.getElementById("companyJobCount");
let applicationCount = document.getElementById("companyApplicationCount");
let jobsCountBanner = document.getElementById("companyJobCountBanner");
let applicationCountBanner = document.getElementById("companyApplicationCountBanner");
let companyName = localStorage.getItem("companyName") || "";

if(!jobsCount && !applicationCount && !jobsCountBanner && !applicationCountBanner){
return;
}

if(!companyName){
if(jobsCount){
jobsCount.innerText = "0";
}

if(applicationCount){
applicationCount.innerText = "0";
}

if(jobsCountBanner){
jobsCountBanner.innerText = "0";
}

if(applicationCountBanner){
applicationCountBanner.innerText = "0";
}

return;
}

fetch(`/api/jobs?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(jobs=>{

if(jobsCount){
jobsCount.innerText = jobs.length;
}

if(jobsCountBanner){
jobsCountBanner.innerText = jobs.length;
}

return fetch(`/api/get-applications?companyName=${encodeURIComponent(companyName)}`);
})
.then(res=>res.json())
.then(applications=>{

if(applicationCount){
applicationCount.innerText = applications.length;
}

if(applicationCountBanner){
applicationCountBanner.innerText = applications.length;
}
})
.catch(()=>{
if(jobsCount){
jobsCount.innerText = "0";
}

if(applicationCount){
applicationCount.innerText = "0";
}

if(jobsCountBanner){
jobsCountBanner.innerText = "0";
}

if(applicationCountBanner){
applicationCountBanner.innerText = "0";
}
});

}

function loadStudentsManagement(){

fetch("/api/students")
.then(res=>res.json())
.then(data=>{

let table = document.getElementById("studentManagementTable");

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
return;
}

let rows = "";

data.forEach(student=>{
rows += `
<tr>
<td><input type="text" id="student-name-${student._id}" value="${getStudentDisplayName(student)}"></td>
<td><input type="email" id="student-email-${student._id}" value="${student.email || ""}"></td>
<td><button onclick="updateStudentDetails('${student._id}')">Update</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let table = document.getElementById("studentManagementTable");

if(table){
table.innerHTML = `<tr><td colspan="3">Unable to load students</td></tr>`;
}
});

}

function updateStudentDetails(id){

let name = document.getElementById(`student-name-${id}`).value.trim();
let email = document.getElementById(`student-email-${id}`).value.trim().toLowerCase();

if(!name || !email){
alert("Name and email are required");
return;
}

fetch(`/api/update-student/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name,
email
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Student update failed");
}

return data;
})
.then(data=>{
alert(data.message);

if(data.message === "Student updated successfully"){
loadStudentsManagement();
}
})
.catch((error)=>{
alert(error.message || "Student update failed");
});

}

function loadCompaniesManagement(){

fetch("/api/companies")
.then(res=>res.json())
.then(data=>{

let table = document.getElementById("companyManagementTable");

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="3">No companies found</td></tr>`;
return;
}

let rows = "";

data.forEach(company=>{
rows += `
<tr>
<td><input type="text" id="company-name-${company._id}" value="${getCompanyDisplayName(company)}"></td>
<td><input type="email" id="company-email-${company._id}" value="${company.email || ""}"></td>
<td><button onclick="updateCompanyDetails('${company._id}')">Update</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let table = document.getElementById("companyManagementTable");

if(table){
table.innerHTML = `<tr><td colspan="3">Unable to load companies</td></tr>`;
}
});

}

function updateCompanyDetails(id){

let companyName = document.getElementById(`company-name-${id}`).value.trim();
let email = document.getElementById(`company-email-${id}`).value.trim().toLowerCase();

if(!companyName || !email){
alert("Company name and email are required");
return;
}

fetch(`/api/update-company/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
companyName,
email
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Company update failed");
}

return data;
})
.then(data=>{
alert(data.message);

if(data.message === "Company updated successfully"){
loadCompaniesManagement();
}
})
.catch((error)=>{
alert(error.message || "Company update failed");
});

}

function loadPasswordManagement(){

fetch("/api/students")
.then(res=>res.json())
.then(students=>{

let studentTable = document.getElementById("studentPasswordTable");
let studentTotal = document.getElementById("passwordStudentCount");

if(studentTotal){
studentTotal.innerText = students.length;
}

if(studentTable){
if(!students.length){
studentTable.innerHTML = `<tr><td colspan="4">No students found</td></tr>`;
}
else{
let rows = "";

students.forEach(student=>{
rows += `
<tr>
<td>${getStudentDisplayName(student)}</td>
<td>${student.email || "-"}</td>
<td><input type="password" id="student-reset-password-${student._id}" placeholder="Enter a new temporary password"></td>
<td><button onclick="updateStudentPassword('${student._id}', '${getStudentDisplayName(student).replace(/'/g, "\\'")}')">Reset Password</button></td>
</tr>
`;
});

studentTable.innerHTML = rows;
}
}

return fetch("/api/companies");
})
.then(res=>res.json())
.then(companies=>{

let companyTable = document.getElementById("companyPasswordTable");
let companyTotal = document.getElementById("passwordCompanyCount");

if(companyTotal){
companyTotal.innerText = companies.length;
}

if(!companyTable){
return;
}

if(!companies.length){
companyTable.innerHTML = `<tr><td colspan="4">No companies found</td></tr>`;
return;
}

let rows = "";

companies.forEach(company=>{
rows += `
<tr>
<td>${getCompanyDisplayName(company)}</td>
<td>${company.email || "-"}</td>
<td><input type="password" id="company-reset-password-${company._id}" placeholder="Enter a new temporary password"></td>
<td><button onclick="updateCompanyPassword('${company._id}', '${getCompanyDisplayName(company).replace(/'/g, "\\'")}')">Reset Password</button></td>
</tr>
`;
});

companyTable.innerHTML = rows;

})
.catch(()=>{
let studentTable = document.getElementById("studentPasswordTable");
let companyTable = document.getElementById("companyPasswordTable");
let studentTotal = document.getElementById("passwordStudentCount");
let companyTotal = document.getElementById("passwordCompanyCount");

if(studentTotal){
studentTotal.innerText = "0";
}

if(companyTotal){
companyTotal.innerText = "0";
}

if(studentTable && !studentTable.innerHTML){
studentTable.innerHTML = `<tr><td colspan="4">Unable to load students</td></tr>`;
}

if(companyTable){
companyTable.innerHTML = `<tr><td colspan="4">Unable to load companies</td></tr>`;
}
});

}

function updateStudentPassword(id, studentName){

let passwordField = document.getElementById(`student-reset-password-${id}`);
let password = passwordField ? passwordField.value.trim() : "";
let label = studentName || "this student";

if(!password){
alert("Please enter a new password");
return;
}

if(!confirm(`Reset the password for ${label}?`)) return;

fetch(`/api/update-student-password/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
password
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Student password reset failed");
}

return data;
})
.then(data=>{
alert(data.message);

if(passwordField){
passwordField.value = "";
}
})
.catch((error)=>{
alert(error.message || "Student password reset failed");
});

}

function updateCompanyPassword(id, companyName){

let passwordField = document.getElementById(`company-reset-password-${id}`);
let password = passwordField ? passwordField.value.trim() : "";
let label = companyName || "this company";

if(!password){
alert("Please enter a new password");
return;
}

if(!confirm(`Reset the password for ${label}?`)) return;

fetch(`/api/update-company-password/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
password
})
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Company password reset failed");
}

return data;
})
.then(data=>{
alert(data.message);

if(passwordField){
passwordField.value = "";
}
})
.catch((error)=>{
alert(error.message || "Company password reset failed");
});

}

function loadRemovalManagement(){

fetch("/api/students")
.then(res=>res.json())
.then(students=>{

let table = document.getElementById("removeStudentTable");
let total = document.getElementById("removeStudentCount");

if(total){
total.innerText = students.length;
}

if(table){
if(!students.length){
table.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
}
else{
let rows = "";

students.forEach(student=>{
rows += `
<tr>
<td>${getStudentDisplayName(student)}</td>
<td>${student.email || "-"}</td>
<td><button class="remove-btn" onclick="deleteStudent('${student._id}', loadRemovalManagement, '${getStudentDisplayName(student).replace(/'/g, "\\'")}')">Remove Account</button></td>
</tr>
`;
});

table.innerHTML = rows;
}
}

return fetch("/api/companies");
})
.then(res=>res.json())
.then(companies=>{

let table = document.getElementById("removeCompanyTable");
let total = document.getElementById("removeCompanyCount");

if(total){
total.innerText = companies.length;
}

if(!table){
return;
}

if(!companies.length){
table.innerHTML = `<tr><td colspan="3">No companies found</td></tr>`;
return;
}

let rows = "";

companies.forEach(company=>{
rows += `
<tr>
<td>${getCompanyDisplayName(company)}</td>
<td>${company.email || "-"}</td>
<td><button class="remove-btn" onclick="deleteCompany('${company._id}', loadRemovalManagement, '${getCompanyDisplayName(company).replace(/'/g, "\\'")}')">Remove Account</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let studentTable = document.getElementById("removeStudentTable");
let companyTable = document.getElementById("removeCompanyTable");
let studentTotal = document.getElementById("removeStudentCount");
let companyTotal = document.getElementById("removeCompanyCount");

if(studentTotal){
studentTotal.innerText = "0";
}

if(companyTotal){
companyTotal.innerText = "0";
}

if(studentTable && !studentTable.innerHTML){
studentTable.innerHTML = `<tr><td colspan="3">Unable to load students</td></tr>`;
}

if(companyTable){
companyTable.innerHTML = `<tr><td colspan="3">Unable to load companies</td></tr>`;
}
});

}

function deleteStudent(id, reloadFn, studentName){

let label = studentName || "this student";

if(!confirm(`Remove ${label}? This will also delete their applications and feedback.`)) return;

fetch(`/api/delete-student/${id}`,{
method:"DELETE"
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Error deleting student");
}

return data;
})
.then(data=>{
alert(data.message);

if(reloadFn){
reloadFn();
}
else{
displayStudents();
}
})
.catch((error)=>{
alert(error.message || "Error deleting student");
});

}

function deleteCompany(id, reloadFn, companyName){

let label = companyName || "this company";

if(!confirm(`Remove ${label}? This will also delete its jobs and related applications.`)) return;

fetch(`/api/delete-company/${id}`,{
method:"DELETE"
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Error deleting company");
}

return data;
})
.then(data=>{
alert(data.message);

if(reloadFn){
reloadFn();
}
else{
loadCompanies();
}
})
.catch((error)=>{
alert(error.message || "Error deleting company");
});

}

function loadRegistrationChecks(){

fetch("/api/students")
.then(res=>res.json())
.then(data=>{

let total = document.getElementById("registrationCount");
let table = document.getElementById("registrationTable");

if(total){
total.innerText = data.length;
}

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="3">No student registrations found</td></tr>`;
return;
}

let rows = "";

data.forEach(student=>{
rows += `
<tr>
<td>${getStudentDisplayName(student)}</td>
<td>${student.email || "-"}</td>
<td>Registered</td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let total = document.getElementById("registrationCount");
let table = document.getElementById("registrationTable");

if(total){
total.innerText = "0";
}

if(table){
table.innerHTML = `<tr><td colspan="3">Unable to load student registrations</td></tr>`;
}
});

}

function loadRegisteredCompaniesPage(){

fetch("/api/companies")
.then(res=>res.json())
.then(data=>{

let total = document.getElementById("registeredCompanyCount");
let table = document.getElementById("registeredCompanyTable");

if(total){
total.innerText = data.length;
}

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="3">No companies found</td></tr>`;
return;
}

let rows = "";

data.forEach(company=>{
rows += `
<tr>
<td>${getCompanyDisplayName(company)}</td>
<td>${company.email || "-"}</td>
<td>Signed up</td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let total = document.getElementById("registeredCompanyCount");
let table = document.getElementById("registeredCompanyTable");

if(total){
total.innerText = "0";
}

if(table){
table.innerHTML = `<tr><td colspan="3">Unable to load companies</td></tr>`;
}
});

}

function loadAdminJobsManagement(){

fetch("/api/jobs")
.then(res=>res.json())
.then(data=>{

let table = document.getElementById("adminJobTable");

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="5">No jobs found</td></tr>`;
return;
}

let rows = "";

data.forEach(job=>{
rows += `
<tr>
<td><input type="text" id="job-title-${job._id}" value="${job.title || ""}"></td>
<td><input type="text" id="job-eligibility-${job._id}" value="${job.eligibility || ""}"></td>
<td><input type="text" id="job-salary-${job._id}" value="${job.salary || ""}"></td>
<td><input type="date" id="job-lastDate-${job._id}" value="${job.lastDate || ""}"></td>
<td><button onclick="updateJobDetails('${job._id}', loadAdminJobsManagement)">Update</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let table = document.getElementById("adminJobTable");

if(table){
table.innerHTML = `<tr><td colspan="5">Unable to load jobs</td></tr>`;
}
});

}

function loadCompanyPostedJobsPage(){

let companyName = localStorage.getItem("companyName") || "";

fetch(`/api/jobs?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(data=>{

let table = document.getElementById("companyPostedJobsTable");

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="6">No jobs posted yet</td></tr>`;
return;
}

let rows = "";

data.forEach(job=>{
rows += `
<tr>
<td><input type="text" id="job-title-${job._id}" value="${job.title || ""}"></td>
<td><input type="text" id="job-eligibility-${job._id}" value="${job.eligibility || ""}"></td>
<td><input type="text" id="job-salary-${job._id}" value="${job.salary || ""}"></td>
<td><input type="date" id="job-lastDate-${job._id}" value="${job.lastDate || ""}"></td>
<td><button onclick="updateJobDetails('${job._id}', loadCompanyPostedJobsPage)">Update</button></td>
<td><button class="remove-btn" onclick="deleteJobAndReload('${job._id}')">Remove</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let table = document.getElementById("companyPostedJobsTable");

if(table){
table.innerHTML = `<tr><td colspan="6">Unable to load jobs</td></tr>`;
}
});

}

function deleteJobAndReload(id){

if(!confirm("Remove this job?")) return;

fetch(`/api/delete-job/${id}`,{
method:"DELETE"
})
.then(res=>res.json())
.then(data=>{
alert(data.message);
loadCompanyPostedJobsPage();
loadCompanyOverviewStats();
});

}

function loadCompanyApplicationsPage(){

let companyName = localStorage.getItem("companyName") || "";

fetch(`/api/get-applications?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(data=>{

let table = document.getElementById("companyApplicationsTable");

if(!table){
return;
}

if(!data.length){
table.innerHTML = `<tr><td colspan="4">No applications yet</td></tr>`;
return;
}

let rows = "";

data.forEach(app=>{
rows += `
<tr>
<td>${app.studentName || "-"}</td>
<td>${app.jobTitle || "-"}</td>
<td>${app.jobId || "-"}</td>
<td><button class="remove-btn" onclick="deleteApplication('${app._id}')">Remove</button></td>
</tr>
`;
});

table.innerHTML = rows;

})
.catch(()=>{
let table = document.getElementById("companyApplicationsTable");

if(table){
table.innerHTML = `<tr><td colspan="4">Unable to load applications</td></tr>`;
}
});

}

function deleteApplication(id){

if(!confirm("Remove this application?")) return;

fetch(`/api/delete-application/${id}`,{
method:"DELETE"
})
.then(async res=>{
let data = await res.json();

if(!res.ok){
throw new Error(data.message || "Error deleting application");
}

return data;
})
.then(data=>{
alert(data.message);
loadCompanyApplicationsPage();
loadCompanyOverviewStats();
})
.catch((error)=>{
alert(error.message || "Error deleting application");
});

}

function initializeFeedbackPage(){
setFeedbackRating(0);
loadStudentFeedbackHistory();
}

function setFeedbackRating(rating){

selectedFeedbackRating = rating;

let stars = document.querySelectorAll(".star-btn");
let label = document.getElementById("feedbackRatingLabel");
let messages = {
0: "Choose a rating",
1: "1 star - Needs major improvement",
2: "2 stars - Could be better",
3: "3 stars - Average experience",
4: "4 stars - Very good",
5: "5 stars - Excellent"
};

stars.forEach((star, index) => {
if(index < rating){
star.classList.add("active");
}
else{
star.classList.remove("active");
}
});

if(label){
label.innerText = messages[rating];
}

}

function submitFeedback(){

let studentName = localStorage.getItem("studentName") || "Student";
let comment = document.getElementById("feedbackComment").value;

if(!selectedFeedbackRating){
alert("Please choose a star rating");
return;
}

fetch("/api/submit-feedback",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
studentName,
rating:selectedFeedbackRating,
comment
})
})
.then(res=>res.json())
.then(data=>{
alert(data.message);
document.getElementById("feedbackComment").value = "";
setFeedbackRating(0);
loadStudentFeedbackHistory();
});

}

function loadStudentFeedbackHistory(){

let studentName = localStorage.getItem("studentName") || "Student";
let container = document.getElementById("studentFeedbackList");

if(!container){
return;
}

fetch(`/api/feedback?studentName=${encodeURIComponent(studentName)}`)
.then(res=>res.json())
.then(data=>{

if(!data.length){
container.innerHTML = `<div class="job-card"><p>No feedback submitted yet.</p></div>`;
return;
}

let html = "";

data.forEach(item=>{
let stars = "&#9733;".repeat(item.rating || 0) + "&#9734;".repeat(5 - (item.rating || 0));

html += `
<div class="feedback-history-card">
<div class="feedback-history-head">
<strong>${stars}</strong>
<span>${new Date(item.createdAt).toLocaleDateString()}</span>
</div>
<p>${item.comment || "No written comment provided."}</p>
</div>
`;
});

container.innerHTML = html;

})
.catch(()=>{
container.innerHTML = `<div class="job-card empty-state-card"><h3>Unable to load feedback</h3><p>Please refresh the page or try again in a moment.</p></div>`;
});

}
