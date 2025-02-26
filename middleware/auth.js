const jwt = require("jsonwebtoken");
const config = require("../utils/config");

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header must start with Bearer",
      });
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
      maxAge: "1h",
    });

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
