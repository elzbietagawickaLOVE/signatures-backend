const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const AuthRouter = require("./routes/auth");
const PackagesRouter = require("./routes/packages");

const app = express();
const port = process.env.PORT || 8080;
const host = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use(helmet());

app.use("/login", AuthRouter);
app.use("/api/packages", PackagesRouter);
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
