const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const app = express();

// middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
  } finally {
  }
}
run().catch(console.dir());

app.get("/", (req, res) => {
  res.send("doctors portal running");
});

app.listen(port, () => {
  console.log("listening", port);
});
