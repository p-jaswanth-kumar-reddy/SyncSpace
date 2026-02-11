const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const roomRoutes = require("./routes/roomRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", roomRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Socket events
io.on("connection", (socket) => {

  // Join room
  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);

    // Load old messages
    const oldMessages = await Message.find({ roomId }).sort({ createdAt: 1 });

    socket.emit("loadMessages", oldMessages);
  });

  // Send message
  socket.on("sendMessage", async (data) => {
    // Save message to DB
    const newMessage = new Message({
      roomId: data.roomId,
      sender: data.sender,
      message: data.message,
    });

    await newMessage.save();

    // Send to other users
    socket.to(data.roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});