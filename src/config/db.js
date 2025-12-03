import "./env.js";
import pkg from "pg";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please configure it in your environment."
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

const REQUIRED_TABLES = [
  "users",
  "plans",
  "profiles",
  "templates",
  "dashboards",
  "dashboard_sections",
  "uploads",
  "resumes",
  "agent_events",
  "skills",
  "links",
  "experiences",
  "projects",
  "achievements",
  "education",
  "certifications",
  "user_subscriptions",
  "admin_actions",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const initSqlPath = path.join(projectRoot, "init.sql");

export const checkRequiredTables = async () => {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1)
  `;

  try {
    const result = await pool.query(query, [REQUIRED_TABLES]);
    const existing = result.rows.map((row) => row.table_name);
    const missing = REQUIRED_TABLES.filter(
      (table) => !existing.includes(table)
    );

    if (missing.length) {
      console.warn(
        `[DB] Missing tables detected: ${missing.join(
          ", "
        )}. Run init.sql to initialize the schema.`
      );
    } else {
      console.log("[DB] All required tables are present.");
    }

    return { existing, missing };
  } catch (error) {
    console.error("[DB] Unable to verify tables:", error.message);
    throw error;
  }
};

const runInitSql = async () => {
  const sql = await readFile(initSqlPath, "utf-8");
  const client = await pool.connect();
  try {
    console.log("[DB] Running init.sql to create missing tables...");
    await client.query(sql);
    console.log("[DB] init.sql executed successfully.");
  } catch (error) {
    console.error("[DB] init.sql execution failed:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

export const ensureDatabaseSchema = async () => {
  const { missing } = await checkRequiredTables();
  if (!missing.length) {
    return;
  }

  await runInitSql();

  const secondPass = await checkRequiredTables();
  if (secondPass.missing.length) {
    throw new Error(
      `Schema initialization incomplete. Still missing: ${secondPass.missing.join(
        ", "
      )}`
    );
  }
  console.log("[DB] Schema initialization complete.");
};

export default pool;
