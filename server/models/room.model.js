const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

/* Hash password before saving */
roomSchema.pre("save", async function () {
  if (this.type === "private" && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model("Room", roomSchema);