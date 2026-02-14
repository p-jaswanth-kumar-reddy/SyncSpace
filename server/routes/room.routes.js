const express = require("express");
const Room = require("../models/room.model");

const router = express.Router();

// Create Room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    const newRoom = await Room.create({ name });

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Failed to create room" });
  }
});

// Get All Rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

module.exports = router;   // 👈 THIS LINE IS CRITICAL