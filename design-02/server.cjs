const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const express = require("express");
const fs = require("fs/promises");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "subscribers.json");
const PUBLIC_FOLDER = path.join(__dirname, "public");

if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.EMAIL_TO
) {
    throw new Error("Please complete your email settings in .env.");
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use(express.json());
app.use(express.static(PUBLIC_FOLDER));

// Save one signup at a time.
let saveQueue = Promise.resolve();

function saveSubscriber(fullName, email) {
    const operation = saveQueue.then(async function() {
        let subscribers = [];

        try {
            const savedData = await fs.readFile(DATA_FILE, "utf8");

            subscribers = JSON.parse(savedData);

            if (!Array.isArray(subscribers)) {
                throw new Error("Subscriber data is not a list.");
            }

        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }

        const alreadyExists = subscribers.some(function(subscriber) {
            return subscriber.email === email;
        });

        if (alreadyExists) {
            return false;
        }

        subscribers.push({
            fullName: fullName,
            email: email,
            joinedAt: new Date().toISOString()
        });

        await fs.writeFile(
            DATA_FILE + ".tmp",
            JSON.stringify(subscribers, null, 2),
            "utf8"
        );

        await fs.rename(DATA_FILE + ".tmp", DATA_FILE);

        return true;
    });

    saveQueue = operation.catch(function() {});

    return operation;
}

app.post("/api/signup", async function(req, res) {
    try {
        const body = req.body || {};

        const fullName =
            typeof body.fullName === "string"
                ? body.fullName.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        if (fullName === "") {
            return res.status(400).json({
                message: "Please enter your full name."
            });
        }

        if (fullName.length > 100) {
            return res.status(400).json({
                message: "Your name is too long."
            });
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        const saved = await saveSubscriber(fullName, email);

        if (!saved) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        // Send a welcome email to the subscriber.
        try {
            await transporter.sendMail({
                from: {
                    name: "The Brown Print",
                    address: process.env.EMAIL_USER
                },
                to: email,
                replyTo: process.env.EMAIL_USER,
                subject: "Welcome to The Brown Print!",
                text:
                    "Hello " + fullName + ",\n\n" +
                    "Thank you for joining The Brown Print!\n\n" +
                    "I'm glad you're here. I'll be sharing my journey " +
                    "of building my life, career and creator business " +
                    "from scratch.\n\n" +
                    "The wins, the lessons and the behind-the-scenes.\n\n" +
                    "We'll keep building, learning and growing, " +
                    "brick by brick.\n\n" +
                    "You'll only hear from me when I have " +
                    "something worth sharing.\n\n" +
                    "Mavericklink\n" +
                    "The Brown Print"
            });

        } catch (error) {
            console.error(
                "Signup saved, but welcome email failed:",
                error
            );
        }

        // Notify the owner about the new signup.
        try {
            await transporter.sendMail({
                from: {
                    name: "The Brown Print",
                    address: process.env.EMAIL_USER
                },
                to: process.env.EMAIL_TO,
                replyTo: email,
                subject: "New signup — The Brown Print",
                text:
                    "Someone joined The Brown Print.\n\n" +
                    "Full name: " + fullName + "\n" +
                    "Email: " + email
            });

        } catch (error) {
            console.error(
                "Signup saved, but owner notification failed:",
                error
            );
        }

        return res.status(201).json({
            message: "Your details have been saved."
        });

    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
});

// Connect the owner's newsletter dashboard.
const mountNewsletter = require("./newsletter.cjs");

mountNewsletter(app, transporter);

app.listen(PORT, function() {
    console.log(
        "The Brown Print is running at http://localhost:" + PORT
    );
});