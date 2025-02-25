require("dotenv").config();

const config = {
  // Database configuration
  database: {
    server: process.env.DB_SERVER,
    authentication: {
      type: "default",
      options: {
        userName: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      },
    },
    options: {
      database: process.env.DB_NAME,
      encrypt: true,
      trustServerCertificate: true,
      pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
      },
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: "1h",
  },
};

module.exports = config;
