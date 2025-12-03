import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool, { ensureDatabaseSchema } from "./config/db.js";
import { verifyVultrConnection } from "./config/storage.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`OpenPersona API running on port ${PORT}`);
});

const logStartupStatus = async () => {
  try {
    await ensureDatabaseSchema();
  } catch (error) {
    console.error("[Startup] Database verification failed:", error.message);
  }

  try {
    await verifyVultrConnection();
  } catch (error) {
    console.error("[Startup] Vultr verification failed:", error.message);
  }
};

logStartupStatus();

const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
