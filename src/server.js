const env = require("./config/env");
const app = require("./app");
const { pool } = require("./config/mysql");
const { connectMongo } = require("./config/mongo");
const { bootstrapApplication } = require("./config/bootstrap");

async function startServer() {
  try {
    await pool.query("SELECT 1");
    await bootstrapApplication();
    await connectMongo();

    app.listen(env.port, () => {
      console.log(`CampusSponsor backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start CampusSponsor:", error);
    process.exit(1);
  }
}

startServer();
