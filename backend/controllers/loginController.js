import User from "../models/User.js"
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";

const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const decryptedBytes = CryptoJS.AES.decrypt(user.password, process.env.PASSWORD_SECRET_KEY || "Rishi@183");
    const originalPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);

    if (originalPassword !== password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "Rishi",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default loginController;
