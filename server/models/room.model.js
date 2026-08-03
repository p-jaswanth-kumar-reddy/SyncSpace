const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    password: {
      type: String,
      default: undefined,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Unique index on (name, type) so public & private rooms can share names,
// but two public rooms (or two private rooms) cannot have the same name.
roomSchema.index({ name: 1, type: 1 }, { unique: true });

/**
 * Hash room password before saving for private rooms.
 * If room becomes public, remove the hashed password.
 */
roomSchema.pre("save", async function () {
  if (this.type === "private") {
    if (this.isModified("password") && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  } else {
    // Public rooms should never store a password
    this.password = undefined;
  }
});

module.exports = mongoose.model("Room", roomSchema);