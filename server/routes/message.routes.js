const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getMessages,
  searchMessages,
  createMessage,
} = require("../controllers/message.controller");

const router = express.Router();

/* ================= MESSAGE ROUTES ================= */
router.get("/search/:roomId", verifyToken, searchMessages);
router.get("/:roomId", verifyToken, getMessages);
router.post("/", verifyToken, createMessage);

module.exports = router;