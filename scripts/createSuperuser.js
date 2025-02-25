require("dotenv").config();
const { executeQuery } = require("../utils/sqlHelper");
const { hashPassword } = require("../utils/passwordUtils");

async function createSuperuser() {
  try {
    const password = await hashPassword(process.env.SUPERUSER_PASSWORD);

    await executeQuery(
      `
      INSERT INTO users (username, password, role)
      VALUES (@username, @password, 'admin')
      `,
      {
        username: process.env.SUPERUSER_USERNAME,
        password: password,
      }
    );

    console.log("Superuser created successfully");
  } catch (error) {
    console.error("Failed to create superuser:", error);
  }
}

createSuperuser();
