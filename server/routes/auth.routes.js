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
console.log("Sending verification to:", email);
console.log("Verification Code:", verificationCode);

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

/* ================= RESEND VERIFICATION ================= */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found. Please register." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = newCode;
    await user.save();

    await sendEmail(
      email,
      "SyncSpace Verification Code",
      `Your new verification code is: ${newCode}`
    );

    return res.json({
      message: "New verification code sent to your email.",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Failed to resend verification code.",
    });
  }
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
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const resetCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      await sendEmail(
        email,
        "SyncSpace Password Reset",
        `Your password reset code is: ${resetCode}`
      );
    }

    // Always same response (prevents email enumeration)
    return res.json({
      message:
        "If the email is registered, a password reset code has been sent.",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

/* ================= RESEND RESET CODE ================= */
router.post("/resend-reset-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const newResetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordCode = newResetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await sendEmail(
      email,
      "SyncSpace Password Reset Code",
      `Your new password reset code is: ${newResetCode}`
    );

    return res.json({
      message: "New reset code sent to email.",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Failed to resend reset code.",
    });
  }
});
/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // 1️⃣ Basic validation
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });

    // 3️⃣ Validate reset code + expiry safely
    if (
      !user ||
      !user.resetPasswordCode ||
      user.resetPasswordCode !== code ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired reset code.",
      });
    }

    // 4️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // 5️⃣ Clear reset data
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      message: "Password reset successful. You can now login.",
    });

  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;