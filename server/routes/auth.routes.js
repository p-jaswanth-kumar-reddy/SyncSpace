const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resendResetCode,
  resetPassword,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/auth.middleware");

const router = express.Router();

// Rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
});

// Stricter limiter for login/verify/reset-password to prevent brute forcing
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
});

/* ================= AUTH ROUTES ================= */
router.post("/register", authLimiter, register);
router.post("/verify", strictLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/login", strictLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/resend-reset-code", authLimiter, resendResetCode);
router.post("/reset-password", strictLimiter, resetPassword);
router.get("/me", verifyToken, getMe);

module.exports = router;