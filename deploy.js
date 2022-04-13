require('dotenv').config();
const PowerShell = require("powershell");

// let ps = new PowerShell(`echo ${process.env.KINTONE_BASE_URL}`);
let ps = new PowerShell(`kintone-plugin-uploader --base-url ${process.env.KINTONE_BASE_URL} --username ${process.env.KINTONE_USERNAME} --password ${process.env.KINTONE_PASSWORD} dist/plugin.zip`);

// Handle process errors (e.g. powershell not found)
ps.on("error", err => {
  console.error(err);
});

// Stdout
ps.on("output", data => {
  console.log(data);
});

// Stderr
ps.on("error-output", data => {
  console.error(data);
});

// End
ps.on("end", code => {
  // Do Something on end
});