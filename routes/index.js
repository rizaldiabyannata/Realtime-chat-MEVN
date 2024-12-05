const express = require("express");
const router = express.Router();
const auth = require("./userRoutes");
const chat = require("./chatRoutes");

router.use("/auth", auth);
router.use("/chat", chat);

// Add a new path for testing
router.get("/test", (req, res) => {
  res.json({ message: "Hello from the test route!" });
});

module.exports = router;
