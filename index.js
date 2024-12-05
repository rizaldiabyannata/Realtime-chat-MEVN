const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const router = require("./routes/index");

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
    origin: "http://192.168.1.40:5173", // Allow only this origin
    methods: ["GET", "POST"],
    credentials: true, // Allow credentials (cookies)
  },
});

// Middleware for CORS
const corsOptions = {
  origin: "http://192.168.1.40:5173", // Allow only this origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  credentials: true, // Allow sending cookies with requests
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// app.use(
//   session({
//     secret: process.env.JWT_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: store,
//     cookie: {
//       maxAge: 86400 * 1000,
//     },
//   })
// );
// Socket.io handlers
io.on("connection", (socket) => {
  console.log("A user connected");

  // Ensure user joins the general channel by default
  socket.join("general");

  // Bergabung dengan channel
  socket.on("join_channel", async (channel) => {
    socket.join(channel);
    try {
      // Ambil pesan yang sudah ada di channel ini
      const messages = await Message.find({ name: channel.name }).sort({
        timestamp: 1,
      });
      socket.emit("previous_messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  });

  // Menangani pengiriman pesan
  socket.on("chat_message", async (data) => {
    try {
      console.log(data);

      const { channel, user, message } = data;
      const newMessage = new Message({
        channel: channel,
        user: user,
        message,
      });
      await newMessage.save();

      // Pastikan hanya mengirimkan pesan ke channel yang tepat
      io.to(channel).emit("chat_message", {
        username: user.username,
        message: message,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Define routes
app.use("/api", router);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
