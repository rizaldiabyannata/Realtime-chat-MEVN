const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// MongoDB connection
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => console.log("MongoDB connected successfully"));

// Models
const Message = require("./models/messageModel");

// Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io handlers
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join_channel", async (channel) => {
    socket.join(channel);
    console.log(`User joined channel: ${channel}`);
    try {
      const messages = await Message.find({ channel }).sort({ timestamp: 1 });
      socket.emit("previous_messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  });

  socket.on("chat_message", async (data) => {
    try {
      const { channel, username, message } = data;
      const newMessage = new Message({ channel, username, message });
      await newMessage.save();
      io.to(channel).emit("chat_message", { username, message });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
