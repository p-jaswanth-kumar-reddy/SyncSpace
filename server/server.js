const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/message.model");
const cors = require("cors");

dotenv.config({ quiet: true });

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

const roomRoutes = require("./routes/room.routes");
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");

// Socket Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(express.json());

// 🔥 MOUNT ROUTES HERE
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;

// Socket logic
io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
    });

    socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
    });

    socket.on("sendMessage", async (data) => {
        const newMessage = await Message.create({
            roomId: data.roomId,
            sender: data.sender,
            content: data.content,
        });

        io.to(data.roomId).emit("receiveMessage", newMessage);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// DB + Server start
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MongoDB");
        console.error(err.message);
    });