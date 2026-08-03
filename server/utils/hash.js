const bcrypt = require("bcryptjs");

/**
 * Hash a plaintext password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plaintext password with hashed password
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random 6-digit verification/reset code
 */
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { hashPassword, comparePassword, generateCode };