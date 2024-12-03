// routes/chatRoutes.js
const express = require("express");
const { getMessages, saveMessage } = require("../controllers/chatController");

const router = express.Router();

// Route untuk mendapatkan riwayat pesan dalam sebuah channel
router.get("/:channel/messages", async (req, res) => {
  try {
    const { channel } = req.params;
    const messages = await getMessages(channel);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Route untuk menyimpan pesan baru (bisa juga diintegrasikan dengan Socket.io untuk realtime)
router.post("/:channel/messages", async (req, res) => {
  try {
    const { channel } = req.params;
    const { username, message } = req.body;
    const savedMessage = await saveMessage(channel, username, message);
    res.json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: "Error saving message" });
  }
});

module.exports = router;
