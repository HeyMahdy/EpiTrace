import express from "express";
import query from "../../config/db.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const result = await query("SELECT NOW() as time, version();");
    res.status(200).json({
      status: "RUNNING",
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0].time,
      dbVersion: result.rows[0].version,
    });
  } catch (err) {
    console.error("Health Check Error", err.message, err.stack);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

export default router;