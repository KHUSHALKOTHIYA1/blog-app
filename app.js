const express = require("express");
const db = require("./config/db");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/usersRoutes");

dotenv.config();
const app = express();
app.use(bodyParser.json());

app.use("/", userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`server is running at ${PORT}`));
