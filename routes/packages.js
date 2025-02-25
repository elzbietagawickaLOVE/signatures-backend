const express = require("express");
const { executeQuery } = require("../utils/sqlHelper");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

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

const validateSignature = [
  body("package_number").notEmpty().trim(),
  body("signature").notEmpty().isBase64(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

router.get("/", async (req, res) => {
  const query = `
    SELECT id, package_number FROM signatures`;

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
      data: results,
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});

router.get("/signatures", async (req, res) => {
  const query = `
      SELECT id, package_number, signature FROM signature`;

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
      data: results,
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
      DELETE FROM signatures 
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
  const { package_number } = req.query;

  if (!package_number?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Package number parameter is required",
    });
  }

  const query = `
      INSERT INTO signatures (package_number) 
      VALUES (@package_number);
      SELECT * FROM signatures WHERE package_number = @package_number;
    `;

  try {
    const result = await executeQuery(query, { package_number });
    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});
router.put("/", validateSignature, async (req, res) => {
  const { package_number, signature } = req.body;

  const query = `
        UPDATE signatures
        SET signature = @signature
        OUTPUT INSERTED.*
        WHERE package_number = @package_number;
      `;

  try {
    const result = await executeQuery(query, { package_number, signature });

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No package found with package_number: ${package_number}`,
      });
    }

    return res.json({
      success: true,
      message: "Package updated successfully",
      data: result[0],
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
});

module.exports = router;
