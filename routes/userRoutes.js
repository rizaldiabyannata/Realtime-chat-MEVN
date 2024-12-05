const express = require("express");
const {
  login,
  logout,
  protect,
  register,
  getDataFromCookie,
} = require("../controllers/authController");

const { getUser } = require("../controllers/userController");

const router = express.Router();

// Login
router.post("/login", login);

// Register
router.post("/register", register);

// Logout
router.post("/logout", logout);

// Test protected route
router.get("/protected", protect, (req, res) => {
  res.status(200).json({ message: "You have access", userId: req.userId });
});

router.get("/get-cookie-data", getDataFromCookie);

router.get("/get-user/:id", protect, getUser);

module.exports = router;
