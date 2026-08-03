const { Server } = require("socket.io");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const RoomMember = require("../models/roomMember.model");
const Room = require("../models/room.model");
const { verifySocketToken } = require("../middlewares/auth.middleware");
const mongoose = require("mongoose");

// Map of online users: userId -> set of socketIds
const onlineUsersMap = new Map();

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    // Auto-reconnect handled by client
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // Socket authentication via handshake auth token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = verifySocketToken(token);
    if (!user) {
      return next(new Error("Unauthorized"));
    }
    socket.user = user;
    next();
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);
    const currentUserId = socket.user.userId;

    // Track online presence
    if (!onlineUsersMap.has(currentUserId)) {
      onlineUsersMap.set(currentUserId, new Set());
    }
    onlineUsersMap.get(currentUserId).add(socket.id);
    socket.userId = currentUserId;

    // Update DB status to online
    User.findByIdAndUpdate(currentUserId, { status: "online" }).catch((err) =>
      console.error("Error updating user status online:", err)
    );

    const onlineUserIds = Array.from(onlineUsersMap.keys());
    io.emit("presenceUpdate", { userId: currentUserId, status: "online", onlineUsers: onlineUserIds });

    // JOIN ROOM
    socket.on("joinRoom", async ({ roomId }) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;

      // Verify membership before joining socket room
      const member = await RoomMember.findOne({ room: roomId, user: currentUserId });
      const isRoomCreator = await Room.exists({ _id: roomId, creator: currentUserId });

      if (!member && !isRoomCreator) {
        socket.emit("error", { message: "You are not a member of this room" });
        return;
      }

      socket.join(roomId);
      console.log(`✅ ${socket.id} joined room ${roomId}`);

      const user = await User.findById(currentUserId).select("name email avatarUrl");
      socket.to(roomId).emit("userJoined", {
        roomId,
        user,
        message: `${user?.name || "User"} joined the room`,
      });
    });

    // LEAVE ROOM
    socket.on("leaveRoom", ({ roomId }) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;
      socket.leave(roomId);
      console.log(`❌ ${socket.id} left room ${roomId}`);

      User.findById(currentUserId)
        .select("name email avatarUrl")
        .then((user) => {
          socket.to(roomId).emit("userLeft", {
            roomId,
            user,
            message: `${user?.name || "User"} left the room`,
          });
        })
        .catch(() => {});
    });

    // TYPING INDICATORS
    socket.on("typing", ({ roomId }) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;
      socket.to(roomId).emit("userTyping", { roomId, user: { _id: currentUserId, name: socket.user.name } });
    });

    socket.on("stopTyping", ({ roomId }) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;
      socket.to(roomId).emit("userStopTyping", { roomId, user: { _id: currentUserId, name: socket.user.name } });
    });

    // SEND MESSAGE
    socket.on("sendMessage", async (data) => {
      try {
        const { roomId, message, messageType, fileUrl, fileName, fileSize } = data;

        if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;

        // Prevent empty text messages
        const content = (message || "").trim();
        if (!content && !fileUrl) return;

        // Verify membership
        const member = await RoomMember.findOne({ room: roomId, user: currentUserId });
        const isRoomCreator = await Room.exists({ _id: roomId, creator: currentUserId });
        if (!member && !isRoomCreator) {
          socket.emit("error", { message: "You are not a member of this room" });
          return;
        }

        // Save to MongoDB
        const createdMsg = await Message.create({
          roomId,
          sender: currentUserId,
          senderName: socket.user.name,
          content,
          messageType: messageType || "text",
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
          readBy: [currentUserId],
        });

        const savedMessage = await Message.findById(createdMsg._id).populate(
          "sender",
          "name email avatarUrl"
        );

        io.to(roomId).emit("receiveMessage", savedMessage);
      } catch (err) {
        console.error("Error saving/sending message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      console.log("❌ User disconnected:", socket.id);

      if (onlineUsersMap.has(currentUserId)) {
        const userSockets = onlineUsersMap.get(currentUserId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsersMap.delete(currentUserId);
          try {
            await User.findByIdAndUpdate(currentUserId, {
              status: "offline",
              lastSeen: new Date(),
            });
            const onlineUserIds = Array.from(onlineUsersMap.keys());
            io.emit("presenceUpdate", {
              userId: currentUserId,
              status: "offline",
              onlineUsers: onlineUserIds,
            });
          } catch (err) {
            console.error("Error updating user status offline:", err);
          }
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocket, onlineUsersMap };