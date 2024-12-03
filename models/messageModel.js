const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  channel: String,
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
