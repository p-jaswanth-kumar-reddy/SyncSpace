const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");

const connectDB = require("./config/db");
const { initializeSocket } = require("./sockets/socket");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();
const server = http.createServer(app);

// CORS Configuration - allow all origins in dev, restrict in production
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "5mb" }));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route Imports
const roomRoutes = require("./routes/room.routes");
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");
const uploadRoutes = require("./routes/upload.routes");
const userRoutes = require("./routes/user.routes");

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SyncSpace API is running" });
});

// Mount API Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

// Socket Setup
initializeSocket(server);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// DB + Server start
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});