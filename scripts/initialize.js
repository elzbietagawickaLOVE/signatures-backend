const {
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../utils/sqlHelper");

async function initializeDatabase() {
  let transaction;
  try {
    transaction = await beginTransaction();

    // Drop tables if they exist (split into separate queries)
    await executeQuery(
      `
      IF OBJECT_ID('dbo.signatures', 'U') IS NOT NULL 
        DROP TABLE dbo.signatures;
    `,
      {},
      transaction
    );

    await executeQuery(
      `
      IF OBJECT_ID('dbo.users', 'U') IS NOT NULL 
        DROP TABLE dbo.users;
    `,
      {},
      transaction
    );

    console.log("Existing tables dropped");

    // Create signatures table
    await executeQuery(
      `
      CREATE TABLE dbo.signatures (
        id INT IDENTITY(1,1) PRIMARY KEY,
        package_number NVARCHAR(100) NOT NULL UNIQUE,
        signature VARBINARY(MAX),
        created_at DATETIME DEFAULT GETDATE()
      )
    `,
      {},
      transaction
    );

    // Create index separately
    await executeQuery(
      `
      CREATE INDEX idx_package_number 
      ON dbo.signatures(package_number)
    `,
      {},
      transaction
    );

    console.log("Signatures table initialized");

    // Create users table
    await executeQuery(
      `
      CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME
      )
    `,
      {},
      transaction
    );

    // Create index separately
    await executeQuery(
      `
      CREATE INDEX idx_username 
      ON dbo.users(username)
    `,
      {},
      transaction
    );

    console.log("Users table initialized");

    await commitTransaction(transaction);
    console.log("Database initialization completed successfully");
  } catch (err) {
    if (transaction) {
      await rollbackTransaction(transaction);
      console.error("Transaction rolled back due to error");
    }
    console.error("Initialization error:", err);
    process.exit(1);
  }
}

initializeDatabase()
  .then(() => {
    console.log("Initialization script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
