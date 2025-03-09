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

    await executeQuery(
      `
      IF OBJECT_ID('dbo.shipments', 'U') IS NOT NULL 
        DROP TABLE dbo.shipments;
    `,
      {},
      transaction
    );

    await executeQuery(
      `
      IF OBJECT_ID('dbo.receipts', 'U') IS NOT NULL 
        DROP TABLE dbo.receipts;
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

    // Fixed timezone calculation: Start with UTC and convert to Warsaw
    await executeQuery(
      `
      CREATE TABLE dbo.shipments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        signature NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT (GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Central European Standard Time')
      )
    `,
      {},
      transaction
    );

    console.log("Shipments table initialized");

    // Fixed timezone calculation: Start with UTC and convert to Warsaw
    await executeQuery(
      `
      CREATE TABLE dbo.receipts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        package_number NVARCHAR(100) NOT NULL UNIQUE,
        signed_at DATETIMEOFFSET,
        signature NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT (GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Central European Standard Time')
      )
    `,
      {},
      transaction
    );

    await executeQuery(
      `
      CREATE INDEX idx_package_number 
      ON dbo.receipts(package_number)
    `,
      {},
      transaction
    );

    console.log("Receipts table initialized");

    // Fixed timezone calculation: Start with UTC and convert to Warsaw
    await executeQuery(
      `
      CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at DATETIMEOFFSET DEFAULT (GETUTCDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Central European Standard Time'),
        last_login DATETIMEOFFSET
      )
    `,
      {},
      transaction
    );

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
