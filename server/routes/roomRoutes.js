const express = require("express");
const router = express.Router();
const { createRoom } = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/rooms", authMiddleware, createRoom);

module.exports = router;