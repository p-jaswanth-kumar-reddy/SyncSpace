const mongoose = require("mongoose");
const Room = require("../models/room.model");
const RoomMember = require("../models/roomMember.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const { comparePassword } = require("../utils/hash");

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private (JWT)
 */
const createRoom = async (req, res) => {
  try {
    const { name, type, password, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name required" });
    }

    const trimmedName = name.trim();
    const roomType = type === "private" ? "private" : "public";

    // Ensure unique (name, type) pairs
    const existing = await Room.findOne({ name: trimmedName, type: roomType });
    if (existing) {
      return res.status(400).json({ message: "Room already exists" });
    }

    if (roomType === "private" && !password) {
      return res.status(400).json({ message: "Password required for private room" });
    }

    const room = await Room.create({
      name: trimmedName,
      type: roomType,
      password: roomType === "private" ? password : undefined,
      creator: req.user.userId,
      description: description || "",
    });

    // Add creator as owner member
    await RoomMember.create({
      room: room._id,
      user: req.user.userId,
      role: "owner",
    });

    const populatedRoom = await Room.findById(room._id)
      .select("-password")
      .populate("creator", "name email avatarUrl");

    res.status(201).json(populatedRoom);
  } catch (err) {
    console.error("CREATE ROOM ERROR:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

/**
 * @desc    Get all public rooms
 * @route   GET /api/rooms
 * @access  Public
 */
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" })
      .select("-password")
      .populate("creator", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error("GET ROOMS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};

/**
 * @desc    Get joined rooms for logged-in user
 * @route   GET /api/rooms/joined
 * @access  Private
 */
const getJoinedRooms = async (req, res) => {
  try {
    const memberships = await RoomMember.find({ user: req.user.userId })
      .populate({
        path: "room",
        select: "-password",
        populate: { path: "creator", select: "name email avatarUrl" },
      })
      .sort({ joinedAt: -1 });

    const joinedRooms = memberships
      .filter((m) => m.room !== null)
      .map((m) => m.room);

    res.json(joinedRooms);
  } catch (err) {
    console.error("GET JOINED ROOMS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch joined rooms" });
  }
};

/**
 * @desc    Join a room
 * @route   POST /api/rooms/join
 * @access  Private
 */
const joinRoom = async (req, res) => {
  try {
    const { roomId, password } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID required" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.type === "private") {
      if (!password) {
        return res.status(400).json({ message: "Password is required for private room" });
      }
      const isMatch = await comparePassword(password, room.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password" });
      }
    }

    const existingMember = await RoomMember.findOne({
      room: roomId,
      user: req.user.userId,
    });

    if (!existingMember) {
      await RoomMember.create({
        room: roomId,
        user: req.user.userId,
        role: "member",
      });
    }

    const populatedRoom = await Room.findById(roomId)
      .select("-password")
      .populate("creator", "name email avatarUrl");

    res.json({ message: "Access granted", room: populatedRoom });
  } catch (err) {
    console.error("JOIN ROOM ERROR:", err);
    res.status(500).json({ message: "Join failed" });
  }
};

/**
 * @desc    Leave a room
 * @route   POST /api/rooms/leave
 * @access  Private
 */
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID required" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Prevent the creator from leaving their own room without transferring ownership
    if (room.creator && room.creator.toString() === req.user.userId) {
      return res.status(400).json({
        message: "Room creator cannot leave. Delete the room or transfer ownership instead.",
      });
    }

    await RoomMember.deleteOne({ room: roomId, user: req.user.userId });
    res.json({ message: "Left room successfully" });
  } catch (err) {
    console.error("LEAVE ROOM ERROR:", err);
    res.status(500).json({ message: "Failed to leave room" });
  }
};

/**
 * @desc    Get room members
 * @route   GET /api/rooms/:roomId/members
 * @access  Private
 */
const getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    // Only room members can view the member list
    const membership = await RoomMember.findOne({ room: roomId, user: req.user.userId });
    const isCreator = await Room.exists({ _id: roomId, creator: req.user.userId });
    if (!membership && !isCreator) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const members = await RoomMember.find({ room: roomId })
      .populate("user", "name email avatarUrl status lastSeen")
      .sort({ joinedAt: 1 });

    res.json(members);
  } catch (err) {
    console.error("GET ROOM MEMBERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch room members" });
  }
};

/**
 * @desc    Update room settings (creator only)
 * @route   PUT /api/rooms/:roomId
 * @access  Private (Creator)
 */
const updateRoom = async (req, res) => {
  try {
    const { name, description, password, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(req.params.roomId);

    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.creator && room.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the room creator can modify room settings" });
    }

    if (name) room.name = name.trim();
    if (description !== undefined) room.description = description;

    // Handle type change: require password when switching to private
    if (type && type !== room.type) {
      if (type === "private" && !password) {
        return res.status(400).json({ message: "Password required when switching to private room" });
      }
      room.type = type;
    }

    // Fix: Check the room's actual type (not the request body) so password
    // updates work even when the client doesn't send `type` in the payload.
    if (password && room.type === "private") room.password = password;

    await room.save();

    const populatedRoom = await Room.findById(room._id)
      .select("-password")
      .populate("creator", "name email avatarUrl");

    res.json({ message: "Room updated successfully", room: populatedRoom });
  } catch (err) {
    console.error("UPDATE ROOM ERROR:", err);
    res.status(500).json({ message: "Failed to update room" });
  }
};

/**
 * @desc    Delete room (creator only)
 * @route   DELETE /api/rooms/:roomId
 * @access  Private (Creator)
 */
const deleteRoom = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.creator && room.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the room creator can delete this room" });
    }

    await Room.deleteOne({ _id: room._id });
    await RoomMember.deleteMany({ room: room._id });
    await Message.deleteMany({ roomId: room._id });

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("DELETE ROOM ERROR:", err);
    res.status(500).json({ message: "Failed to delete room" });
  }
};

/**
 * @desc    Invite user to room by email
 * @route   POST /api/rooms/:roomId/invite
 * @access  Private
 */
const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const { roomId } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    // Only room members can invite others
    const membership = await RoomMember.findOne({ room: roomId, user: req.user.userId });
    const isCreator = await Room.exists({ _id: roomId, creator: req.user.userId });
    if (!membership && !isCreator) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const targetUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    const existingMember = await RoomMember.findOne({
      room: roomId,
      user: targetUser._id,
    });

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member of this room" });
    }

    await RoomMember.create({
      room: roomId,
      user: targetUser._id,
      role: "member",
    });

    res.json({ message: `Successfully invited ${targetUser.name} to the room` });
  } catch (err) {
    console.error("INVITE USER ERROR:", err);
    res.status(500).json({ message: "Failed to invite user" });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getJoinedRooms,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateRoom,
  deleteRoom,
  inviteUser,
};