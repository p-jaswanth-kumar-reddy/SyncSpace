const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for a user
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }

  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
    },
    secret,
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;