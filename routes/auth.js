const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { executeQuery } = require("../utils/sqlHelper");
const { comparePassword } = require("../utils/passwordUtils");

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await executeQuery(
      "SELECT * FROM users WHERE username = @username",
      { username }
    );

    if (!user?.length || !(await comparePassword(password, user[0].password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await executeQuery(
      "UPDATE users SET last_login = GETDATE() WHERE id = @id",
      { id: user[0].id }
    );

    const token = jwt.sign(
      { id: user[0].id, role: user[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

module.exports = router;
