const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middlewares/auth.middleware");

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Single file upload endpoint
router.post("/", verifyToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Return relative URL so the client can load files through the Vite proxy
    const fileUrl = `/uploads/${req.file.filename}`;

    let messageType = "file";
    const mime = req.file.mimetype;

    if (mime.startsWith("image/")) messageType = "image";
    else if (mime === "application/pdf") messageType = "pdf";
    else if (mime.startsWith("audio/")) messageType = "voice";

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      messageType,
    });
  } catch (error) {
    res.status(500).json({ message: "File upload failed" });
  }
});

module.exports = router;
