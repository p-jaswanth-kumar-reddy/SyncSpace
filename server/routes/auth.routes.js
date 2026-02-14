const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        await User.create({
            name,
            email,
            password: hashedPassword,
            verificationCode,
        });

        // 👇 THIS IS THE EMAIL SENDING PART
        await sendEmail(
            email,
            "SyncSpace Email Verification",
            `Your verification code is: ${verificationCode}`
        );

        res.status(201).json({
            message: "Verification code sent to email",
        });
    } catch (err) {
        res.status(500).json({ message: "Registration failed" });
    }
});

/* ================= VERIFY EMAIL ================= */
router.post("/verify", async (req, res) => {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.verificationCode !== code)
        return res.status(400).json({ message: "Invalid code" });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
        return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
        return res.status(400).json({ message: "Verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { userId: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token });
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
        return res.status(400).json({ message: "User not found" });

    const resetCode = Math.floor(
        100000 + Math.random() * 900000
    ).toString();

    user.resetPasswordCode = resetCode;
    await user.save();

    console.log("Reset Code:", resetCode);

    res.json({ message: "Reset code sent to email" });
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.resetPasswordCode !== code)
        return res.status(400).json({ message: "Invalid reset code" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;

    await user.save();

    res.json({ message: "Password reset successful" });
});

module.exports = router;