const express = require("express");
const { executeQuery } = require("../utils/sqlHelper");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { decrypt, encrypt } = require("../utils/encryption");

const handleDatabaseError = (err, res) => {
  console.error("Database error:", err);

  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({
      success: false,
      error: "A package with this number already exists",
    });
  }

  return res.status(500).json({
    success: false,
    error: "An internal server error occurred",
  });
};

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const query = `
      SELECT id, signature, created_at FROM shipments`;

  try {
    const results = await executeQuery(query);
    if (!results?.length) {
      return res.status(404).json({
        success: false,
        message: "No packages found.",
      });
    }

    return res.json({
      success: true,
      data: results.map((result) => ({
        signature: result.signature ? decrypt(result.signature) : null,
        created_at: result.created_at,
        id: result.id,
      })),
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Id parameter is required",
    });
  }

  const query = `
      DELETE FROM shipments 
      OUTPUT DELETED.*
      WHERE id = @id;
    `;

  try {
    const results = await executeQuery(query, { id });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No package found with id: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Package with id: '${id}' successfully deleted`,
      deletedPackage: results[0],
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});

router.post("/", async (req, res) => {
  const { signature } = req.body;

  const query = `
      INSERT INTO shipments (signature) 
      VALUES (@signature);
    `;

  try {
    const result = await executeQuery(query, { signature: encrypt(signature) });
    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});

module.exports = router;
