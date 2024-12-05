const express = require("express");
const router = express.Router();
const {
  createChannel,
  joinChannel,
  accessChannel,
  sendMessage,
  getMessages,
  getUserChannels,
} = require("../controllers/chatController");
const { protect } = require("../controllers/authController"); // Middleware untuk melindungi route

// Route untuk membuat channel
router.post("/create", protect, createChannel);

// Route untuk bergabung dengan channel
router.post("/join", protect, joinChannel);

router.post("/access-channel", protect, accessChannel);

// Route untuk mengirim pesan
router.post("/message", protect, sendMessage);

// Route untuk mendapatkan pesan
router.get("/messages", protect, getMessages);

router.get("/get-channel", protect, getUserChannels);

module.exports = router;
