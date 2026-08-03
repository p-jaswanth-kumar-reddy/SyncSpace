const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },

    resetPasswordCode: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    avatarUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);