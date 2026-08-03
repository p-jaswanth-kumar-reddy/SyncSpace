const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");
const {
  createRoom,
  getRooms,
  getJoinedRooms,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateRoom,
  deleteRoom,
  inviteUser,
} = require("../controllers/room.controller");

const router = express.Router();

/* ================= ROOM ROUTES ================= */
router.post("/", verifyToken, createRoom);
router.get("/", getRooms);
router.get("/joined", verifyToken, getJoinedRooms);
router.post("/join", verifyToken, joinRoom);
router.post("/leave", verifyToken, leaveRoom);

/* Routes with :roomId */
router.get("/:roomId/members", verifyToken, getRoomMembers);
router.put("/:roomId", verifyToken, updateRoom);
router.delete("/:roomId", verifyToken, deleteRoom);
router.post("/:roomId/invite", verifyToken, inviteUser);

module.exports = router;