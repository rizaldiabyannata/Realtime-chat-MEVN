const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Channel = require("../models/channelModel")
const bcrypt = require("bcrypt");

// Helper to create JWT
const createToken = (userId, username) => {
  return jwt.sign({ id: userId, username: username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Cek apakah email sudah ada
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Pastikan channel "general" sudah ada atau buat baru
    let generalChannel = await Channel.findOne({ name: "general" });

    if (!generalChannel) {
      generalChannel = new Channel({
        name: "general",
        users: [], // Pengguna akan ditambahkan di langkah berikut
        createdBy: null, // Tidak ada pencipta khusus
      });
      await generalChannel.save();
    }

    // Tambahkan user ke channel "general"
    generalChannel.users.push(newUser._id);
    await generalChannel.save();

    // Tambahkan channel ke daftar channel user
    newUser.channels.push(generalChannel._id);
    await newUser.save();

    // Buat token
    const token = createToken(newUser._id, newUser.username);

    // Kirim respons sukses
    res.status(201).json({
      message: "User registered successfully and joined 'general' channel",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user._id, user.username);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

// Middleware to protect routes
exports.protect = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized access" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

// Function to retrieve JWT data from cookies
exports.getDataFromCookie = (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ error: "Token not found in cookies" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res
      .status(200)
      .json({ message: "Token data retrieved successfully", data: decoded });
  } catch (error) {
    console.error("Error verifying token:", error.message);
    res.status(401).json({ error: "Invalid token or token expired" });
  }
};
