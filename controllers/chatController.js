// controllers/chatController.js
const Message = require("../models/messageModel");

// Fungsi untuk mendapatkan riwayat pesan berdasarkan channel
const getMessages = async (channel) => {
  try {
    const messages = await Message.find({ channel }).sort({ timestamp: 1 });
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

// Fungsi untuk menyimpan pesan baru ke database
const saveMessage = async (channel, username, message) => {
  try {
    const newMessage = new Message({ channel, username, message });
    const savedMessage = await newMessage.save();
    console.log("Message saved:", savedMessage);
    return savedMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

module.exports = {
  getMessages,
  saveMessage,
};
