const Message = require("../models/message.model");
const RoomMember = require("../models/roomMember.model");
const mongoose = require("mongoose");

/**
 * Verify that the requesting user is a member of the room
 */
const isRoomMember = async (roomId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return false;
  }
  const member = await RoomMember.findOne({ room: roomId, user: userId });
  return !!member;
};

/**
 * @desc    Get messages for a room
 * @route   GET /api/messages/:roomId
 * @access  Private (Room members only)
 */
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    if (!(await isRoomMember(roomId, req.user.userId))) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const messages = await Message.find({ roomId })
      .populate("sender", "name email avatarUrl")
      .sort({ createdAt: 1 })
      .limit(500); // Prevent huge payloads

    res.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/**
 * @desc    Search messages in a room
 * @route   GET /api/messages/search/:roomId
 * @access  Private (Room members only)
 */
const searchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { q } = req.query;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    if (!(await isRoomMember(roomId, req.user.userId))) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    if (!q) return res.json([]);

    const messages = await Message.find({
      roomId,
      content: { $regex: q, $options: "i" },
    })
      .populate("sender", "name email avatarUrl")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error("SEARCH MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Failed to search messages" });
  }
};

/**
 * @desc    Create message via REST API
 * @route   POST /api/messages
 * @access  Private
 */
const createMessage = async (req, res) => {
  try {
    const { roomId, content, messageType, fileUrl, fileName, fileSize } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID required" });
    }

    if (!(await isRoomMember(roomId, req.user.userId))) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const message = await Message.create({
      roomId,
      sender: req.user.userId,
      senderName: req.user.name,
      content: content || "",
      messageType: messageType || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      readBy: [req.user.userId],
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email avatarUrl"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("CREATE MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Failed to send message" });
  }
};

module.exports = { getMessages, searchMessages, createMessage };