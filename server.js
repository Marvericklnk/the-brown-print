const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "subscribers.json");
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));
// Serialize file updates so simultaneous local signups don't overwrite one another.
let pendingSave = Promise.resolve();
app.post("/api/signup", function (req, res) {
  const body = req.body || {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!fullName || fullName.length > 100) {
    return res.status(400).json({ message: "Please enter a name of 100 characters or fewer." });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  pendingSave = pendingSave.then(async function () {
    let subscribers = [];
    try {
      subscribers = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
      if (!Array.isArray(subscribers)) throw new Error("Invalid subscriber data");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (subscribers.some(function (subscriber) { return subscriber.email === email; })) {
      return res.status(409).json({ message: "This email is already registered." });
    }
    subscribers.push({ fullName, email, joinedAt: new Date().toISOString() });
    await fs.writeFile(DATA_FILE + ".tmp", JSON.stringify(subscribers, null, 2), "utf8");
    await fs.rename(DATA_FILE + ".tmp", DATA_FILE);
    res.status(201).json({ message: "Your details have been saved." });
  }).catch(function (error) {
    console.error("Signup error:", error);
    if (!res.headersSent) res.status(500).json({ message: "Something went wrong. Please try again." });
  });
});
app.use(function (error, req, res, next) {
  res.status(error.status || 500).json({ message: "Could not process that request. Please try again." });
});
if (require.main === module) {
  app.listen(PORT, function () { console.log("The Brown Print is running at http://localhost:" + PORT); });
}
module.exports = app;
