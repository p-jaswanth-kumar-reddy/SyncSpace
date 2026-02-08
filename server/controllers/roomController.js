const Room = require("../models/Room");

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    const room = new Room({
      name,
      members: [req.user.userId],
    });

    await room.save();

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};