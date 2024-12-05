const User = require("../models/userModel");

exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      res.status(404).json({ message: "User not found" });
    } else {
      res.status(200).json(user);
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
