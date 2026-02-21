import { Worker } from "bullmq";
import axios from "axios";
import { pool } from "../config/db.js";
import { connection } from "../config/redis.js";
import { analysisQueue } from "./analysisQueue.js";
import { downQueue, downQueueEvents } from "./downQueue.js";

const DOWN_MONITOR_ONCE_KEY_PREFIX = "down-monitor-once";

async function enqueueDownMonitorOnce(monitor, monitorId, errorMessage) {
  const onceKey = `${DOWN_MONITOR_ONCE_KEY_PREFIX}:${monitorId}`;
  const marked = await connection.set(onceKey, "1", "NX");

  if (marked !== "OK") {
    console.log(
      `[down-monitors] skipped (already enqueued once) for monitor ${monitorId}`,
    );
    return;
  }

  const downJob = await downQueue.add("monitor-down", {
    monitorId,
    error_message: errorMessage,
    endpoint: monitor.url,
    git_hub_repo: monitor.repo_link,
  });

  console.log(
    `[down-monitors] enqueued job id=${downJob.id} name=${downJob.name} monitor=${monitorId}`,
  );
}
/**
 * Runs when a monitor is started.
 * 1. Performs immediate check
 * 2. Schedules recurring checks
 */
async function handleMonitorStart(monitorId) {
  console.log("Starting monitor:", monitorId);

  const { rows } = await pool.query("SELECT * FROM monitors WHERE id = $1", [
    monitorId,
  ]);

  if (!rows.length) {
    console.error("Monitor not found");
    return;
  }

  const monitor = rows[0];

  if (!monitor.is_active) {
    console.log("Monitor is not active. Skipping.");
    return;
  }

  // immediate check
  await performCheck(monitorId);

  // schedule recurring checks
  await analysisQueue.upsertJobScheduler(
    `monitor-${monitorId}`,
    {
      every: monitor.check_interval * 1000,
    },
    {
      name: "monitor-check",
      data: { monitorId },
    },
  );

  console.log("Scheduler created for monitor:", monitorId);
}

/**
 * Performs the actual HTTP check
 */
async function performCheck(monitorId) {
  console.log("Checking monitor:", monitorId);

  const { rows } = await pool.query("SELECT * FROM monitors WHERE id = $1", [
    monitorId,
  ]);

  if (!rows.length) {
    console.error("Monitor not found");
    return;
  }

  const monitor = rows[0];

  if (!monitor.is_active) {
    console.log("Monitor paused. Skipping check.");
    return;
  }

  const startedAt = Date.now();

  try {
    const method = monitor.method.toUpperCase();
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...monitor.request_header,
    };

    const response = await axios({
      method,
      url: monitor.url,
      timeout: monitor.timeout * 1000,
      headers,
      ...(method === "GET" || method === "HEAD"
        ? {}
        : { data: monitor.request_body }),
      validateStatus: () => true, // don't throw on 4xx/5xx
    });

    const responseTimeMs = Date.now() - startedAt;

    console.log("HTTP status:", response.status);
    const isUp = response.status >= 200 && response.status < 400;

    // Insert check record
    await pool.query(
      `INSERT INTO monitor_checks 
   (monitor_id, status, response_time_ms, status_code) 
   VALUES ($1, $2, $3, $4)`,
      [monitorId, isUp ? "UP" : "DOWN", responseTimeMs, response.status],
    );

    if (!isUp) {
      console.log(
        `[down-monitors] enqueue requested (HTTP ${response.status}) for monitor ${monitorId}`,
      );
      await enqueueDownMonitorOnce(
        monitor,
        monitorId,
        `Monitor returned HTTP ${response.status}`,
      );
    }

    // Update monitor current status
    await pool.query(
      `UPDATE monitors
   SET status = $1, last_checked_at = NOW()
   WHERE id = $2`,
      [isUp ? "UP" : "DOWN", monitorId],
    );

    console.log(`Monitor ${monitorId} status: ${isUp ? "UP" : "DOWN"}`);
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;

    // Insert failed check
    await pool.query(
      `INSERT INTO monitor_checks 
     (monitor_id, status, error_message, response_time_ms) 
     VALUES ($1, 'DOWN', $2, $3)`,
      [monitorId, error.message, responseTimeMs],
    );

    console.log(
      `[down-monitors] enqueue requested (request error) for monitor ${monitorId}: ${error.message}`,
    );
    await enqueueDownMonitorOnce(monitor, monitorId, error.message);

    await pool.query(
      `UPDATE monitors
     SET status = 'DOWN', last_checked_at = NOW()
     WHERE id = $1`,
      [monitorId],
    );

    console.log(`Monitor ${monitorId} status: DOWN (error: ${error.message})`);
  }
}

/**
 * Worker setup
 */
const worker = new Worker(
  "analysis-requests",
  async (job) => {
    console.log("Job received:", job.name, job.data);

    if (job.name === "monitor-started") {
      await handleMonitorStart(job.data.monitorId);
    }

    if (job.name === "monitor-check") {
      await performCheck(job.data.monitorId);
    }
  },
  { connection },
);

console.log("Analysis worker running...");

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down analysis worker...`);

  try {
    await worker.close();
    await analysisQueue.close();
    await downQueue.close();
    await downQueueEvents.close();
    await connection.quit();
    await pool.end();
    console.log("Analysis worker shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during analysis worker shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
