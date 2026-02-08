const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

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
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  // Send message
  socket.on("sendMessage", (data) => {
    socket.to(data.roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});