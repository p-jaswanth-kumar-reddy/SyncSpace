const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// CREATE ROOM
router.post("/rooms", async (req, res) => {
  try {
    const { name } = req.body;

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const room = new Room({ name });
    await room.save();

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: "Error creating room" });
  }
});

// GET ALL ROOMS  ← THIS IS IMPORTANT
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

module.exports = router;