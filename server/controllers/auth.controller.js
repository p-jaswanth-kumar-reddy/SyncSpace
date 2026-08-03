const User = require("../models/user.model");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");
const { hashPassword, comparePassword, generateCode } = require("../utils/hash");

/**
 * @desc    Register a new user & send verification email
 * @route   POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const verificationCode = generateCode();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      verificationCode,
    });

    console.log(`📱 Generated verification code ${verificationCode} for ${normalizedEmail}`);

    try {
      await sendEmail(
        normalizedEmail,
        "SyncSpace Email Verification",
        `Your verification code is: ${verificationCode}`
      );
    } catch (emailErr) {
      console.error("❌ Verification email send failed:", emailErr.message);
      // User was created but email couldn't be sent. Return 201 so they can resend.
    }

    res.status(201).json({
      message: "Verification code sent to email",
    });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.toString().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.verificationCode || user.verificationCode !== trimmedCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("❌ Email Verification Error:", err.message);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

/**
 * @desc    Resend verification code email
 * @route   POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found. Please register." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const newCode = generateCode();
    user.verificationCode = newCode;
    await user.save();

    console.log(`📱 Generated new verification code ${newCode} for ${normalizedEmail}`);

    try {
      await sendEmail(
        normalizedEmail,
        "SyncSpace Verification Code",
        `Your new verification code is: ${newCode}`
      );
    } catch (emailErr) {
      console.error("❌ Resend verification email failed:", emailErr.message);
    }

    return res.json({
      message: "New verification code sent to your email.",
    });
  } catch (err) {
    console.error("❌ Resend Verification Error:", err.message);
    return res.status(500).json({ message: "Failed to resend verification code." });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Verify your email first" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        status: user.status,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password -verificationCode -resetPasswordCode -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Fetch profile Error:", err.message);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

/**
 * @desc    Send forgot password reset code
 * @route   POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const resetCode = generateCode();
      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      console.log(`📱 Generated password reset code ${resetCode} for ${normalizedEmail}`);

      try {
        await sendEmail(
          normalizedEmail,
          "SyncSpace Password Reset",
          `Your password reset code is: ${resetCode}`
        );
      } catch (emailErr) {
        console.error("❌ Forgot password email send failed:", emailErr.message);
      }
    } else {
      console.warn(`⚠️ Forgot password requested for unregistered email: ${normalizedEmail}`);
    }

    // Always return the same generic message to prevent user enumeration
    return res.json({
      message: "If the email is registered, a password reset code has been sent.",
    });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

/**
 * @desc    Resend reset password code
 * @route   POST /api/auth/resend-reset-code
 */
const resendResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const newResetCode = generateCode();
    user.resetPasswordCode = newResetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    console.log(`📱 Generated new password reset code ${newResetCode} for ${normalizedEmail}`);

    try {
      await sendEmail(
        normalizedEmail,
        "SyncSpace Password Reset Code",
        `Your new password reset code is: ${newResetCode}`
      );
    } catch (emailErr) {
      console.error("❌ Resend reset code email failed:", emailErr.message);
    }

    return res.json({ message: "New reset code sent to email." });
  } catch (err) {
    console.error("❌ Resend Reset Code Error:", err.message);
    return res.status(500).json({ message: "Failed to resend reset code." });
  }
};

/**
 * @desc    Reset password with code
 * @route   POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.toString().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (
      !user ||
      !user.resetPasswordCode ||
      user.resetPasswordCode !== trimmedCode ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({ message: "Password reset successful. You can now login." });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resendResetCode,
  resetPassword,
};