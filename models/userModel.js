const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createAt: { type: Date, default: Date.now },
  channels: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Channel", sparse: true },
  ],
});

module.exports = mongoose.model("User", userSchema);
