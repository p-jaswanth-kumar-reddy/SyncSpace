const express = require("express");
const bcrypt = require("bcryptjs");
const Room = require("../models/room.model");

const router = express.Router();

/* ================= CREATE ROOM ================= */
router.post("/", async (req, res) => {
  try {
    const { name, type, password } = req.body;

    if (!name)
      return res.status(400).json({ message: "Room name required" });

    const existing = await Room.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Room already exists" });

    if (type === "private" && !password)
      return res.status(400).json({ message: "Password required for private room" });

    const room = await Room.create({
      name,
      type,
      password: type === "private" ? password : undefined,
    });

    res.status(201).json({
      _id: room._id,
      name: room.name,
      type: room.type,
    });
} catch (err) {
  console.error("CREATE ROOM ERROR:", err);
  res.status(500).json({ message: err.message });
}
});

/* ================= GET ALL ROOMS ================= */
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().select("-password");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

/* ================= JOIN PRIVATE ROOM ================= */
router.post("/join", async (req, res) => {
  try {
    const { roomId, password } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.type === "private") {
      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch)
        return res.status(400).json({ message: "Incorrect password" });
    }

    res.json({ message: "Access granted" });
  } catch (err) {
    res.status(500).json({ message: "Join failed" });
  }
});

module.exports = router;