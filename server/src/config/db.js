import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function queryDB(text, params) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("Query Error", err.message, err.stack);
    throw err;
  }
}

export default queryDB;
