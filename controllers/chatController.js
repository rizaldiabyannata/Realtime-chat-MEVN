const Channel = require("../models/channelModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");

// 1. Membuat channel
exports.createChannel = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId; // Menggunakan ID pengguna yang sudah login

  try {
    // Cek apakah channel sudah ada
    const existingChannel = await Channel.findOne({ name });
    if (existingChannel)
      return res.status(400).json({ error: "Channel already exists" });

    // Jika nama channel adalah 'general', buat channel khusus general
    const isGeneralChannel = name.toLowerCase() === "general";

    let channel;
    if (isGeneralChannel) {
      // Jika general, pastikan sudah ada di database
      channel = await Channel.findOne({ name: "general" });
      if (!channel) {
        channel = new Channel({
          name: "general",
          users: [], // Tidak perlu menambahkan pengguna terlebih dahulu
          createdBy: null, // Tidak ada pencipta khusus untuk channel ini
        });
        await channel.save();
      }
    } else {
      // Untuk channel lainnya, buatkan channel baru
      channel = new Channel({
        name,
        users: [userId], // Channel dimiliki oleh pengguna yang membuatnya
        createdBy: userId,
      });
      await channel.save();
    }

    // Menambahkan channel ke daftar channel pengguna
    await User.findByIdAndUpdate(userId, { $push: { channels: channel._id } });

    res.status(201).json({ message: "Channel created successfully", channel });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Bergabung dengan channel (termasuk general)
exports.joinChannel = async (req, res) => {
  const { channelId } = req.body;
  const userId = req.userId;

  try {
    // Cari channel berdasarkan ID
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Cek apakah pengguna sudah bergabung
    if (channel.users.includes(userId)) {
      return res.status(400).json({ error: "User already in channel" });
    }

    // Menambahkan pengguna ke channel
    channel.users.push(userId);
    await channel.save();

    // Menambahkan channel ke daftar channel pengguna
    await User.findByIdAndUpdate(userId, { $push: { channels: channelId } });

    res.status(200).json({ message: "Joined channel successfully", channel });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Akses channel tertentu
exports.accessChannel = async (req, res) => {
  const { channelId } = req.body; // ID channel dari parameter URL
  const userId = req.userId; // ID pengguna dari middleware autentikasi

  try {
    // Cari channel berdasarkan ID
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    // Cek apakah pengguna sudah bergabung dengan channel
    if (!channel.users.includes(userId)) {
      return res.status(403).json({
        error: "Access denied. User is not a member of this channel.",
      });
    }

    // Ambil detail channel dan pesan-pesan terbaru
    const messages = await Message.find({ channel: channelId })
      .sort({ timestamp: 1 }) // Urutkan berdasarkan waktu
      .populate("user", "username"); // Tambahkan informasi pengguna pengirim pesan

    res.status(200).json({
      channel: {
        id: channel._id,
        name: channel.name,
        members: channel.users.length,
        createdBy: channel.createdBy,
      },
      messages,
    });
  } catch (error) {
    console.error("Error accessing channel:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 3. Mengirim pesan ke channel
exports.sendMessage = async (req, res) => {
  const { channelId, message } = req.body;
  const userId = req.userId;

  try {
    // Cari channel berdasarkan ID
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Cek apakah pengguna sudah bergabung dengan channel
    if (!channel.users.includes(userId)) {
      return res
        .status(403)
        .json({ error: "User is not a member of this channel" });
    }

    // Simpan pesan ke database
    const newMessage = new Message({
      channel: channelId,
      user: userId,
      message,
    });

    await newMessage.save();

    // Kirimkan pesan ke semua anggota channel melalui socket.io (opsional)
    // io.to(channelId).emit("chat_message", { user: req.user.username, message });

    res.status(200).json({ message: "Message sent successfully", newMessage });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// 4. Mendapatkan pesan dari channel
exports.getMessages = async (req, res) => {
  const { channelId } = req.query;
  const userId = req.userId;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Cek apakah pengguna sudah bergabung
    if (!channel.users.includes(userId)) {
      return res
        .status(403)
        .json({ error: "User is not a member of this channel" });
    }

    // Ambil pesan-pesan dari channel
    const messages = await Message.find({ channel: channelId }).sort({
      timestamp: 1,
    });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Mendapatkan daftar channel yang dimiliki atau diikuti oleh pengguna
exports.getUserChannels = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).populate("channels");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ channels: user.channels });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// 5. Mendapatkan daftar semua channel yang diikuti pengguna
exports.getAllUserChannels = async (req, res) => {
  const userId = req.userId; // ID pengguna dari middleware autentikasi
  console.log(userId);
  try {
    // Cari pengguna berdasarkan ID dan ambil channel yang terkait
    const user = await User.findById(userId).populate("channels");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format data untuk respons
    const userChannels = user.channels.map((channel) => ({
      id: channel._id,
      name: channel.name,
      memberCount: channel.users.length,
      createdBy: channel.createdBy,
    }));

    res.status(200).json({ channels: userChannels });
  } catch (error) {
    console.error("Error fetching user channels:", error);
    res.status(500).json({ error: "Server error" });
  }
};
