import { pool } from "../config/db.js";
import { analysisQueue } from "../queue/analysisQueue.js";
import { retry } from "../utils/retry.js";

export async function createMonitor(userId, data) {
  const client = await pool.connect();

  try {
    // start transaction
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO monitors
      (user_id, name, url, method, request_header, request_body, check_interval, timeout, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const values = [
      userId,
      data.name,
      data.url,
      data.method,
      data.request_header || {},
      data.request_body || {},
      data.check_interval,
      data.timeout,
      data.is_active || false,
    ];

    const result = await client.query(insertQuery, values);
    const monitor = result.rows[0];

    // retry queue push
    if (monitor.is_active) {
      await retry(() =>
        analysisQueue.add("monitor-started", {
          monitorId: monitor.id,
        }),
      );
    }

    // commit only if queue succeeds
    await client.query("COMMIT");

    return monitor;
  } catch (error) {
    // rollback on ANY failure
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

export async function startMonitor(userId, monitorId) {
  const { rows } = await pool.query(
    "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
    [monitorId, userId],
  );

  if (!rows.length) throw new Error("Monitor not found");

  const monitor = rows[0];
  if (monitor.is_active) throw new Error("Monitor already active");
  else {
    await pool.query("UPDATE monitors SET is_active = true WHERE id = $1", [
      monitorId,
    ]);
  }

  await analysisQueue.add("monitor-started", {
    monitorId,
  });
}

export async function pauseMonitor(userId, monitorId) {
  const { rows } = await pool.query(
    "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
    [monitorId, userId],
  );

  if (!rows.length) throw new Error("Monitor not found");

  await pool.query("UPDATE monitors SET is_active = false WHERE id = $1", [
    monitorId,
  ]);

  await analysisQueue.removeJobScheduler(`monitor-${monitorId}`);
}

// Get all monitors for a user (with pagination)
export async function getMonitors(userId, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `SELECT * FROM monitors 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
}

// Get single monitor by ID
export async function getMonitorById(userId, monitorId) {
  const { rows } = await pool.query(
    "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
    [monitorId, userId],
  );

  if (!rows.length) throw new Error("Monitor not found");
  return rows[0];
}
// Update monitor
export async function updateMonitor(userId, monitorId, updates) {
  const allowedFields = [
    "name",
    "url",
    "method",
    "request_header",
    "request_body",
    "check_interval",
    "timeout",
  ];

  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));
  if (!fields.length) throw new Error("No valid fields to update");

  const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(", ");
  const values = fields.map((f) => updates[f]);

  const { rows } = await pool.query(
    `UPDATE monitors 
     SET ${setClause}, updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [monitorId, userId, ...values],
  );

  if (!rows.length) throw new Error("Monitor not found");
  return rows[0];
}

// Delete monitor
export async function deleteMonitor(userId, monitorId) {
  // First pause it (remove scheduler)
  try {
    await pauseMonitor(userId, monitorId);
  } catch (err) {
    // Already paused or not found, continue
  }

  const { rowCount } = await pool.query(
    "DELETE FROM monitors WHERE id = $1 AND user_id = $2",
    [monitorId, userId],
  );

  if (!rowCount) throw new Error("Monitor not found");
}

export async function resumeMonitor(userId, monitorId) {
  return startMonitor(userId, monitorId);
}
// Get monitor check history
export async function getMonitorHistory(
  monitorId,
  userId,
  limit = 100,
  offset = 0,
) {
  // Verify ownership
  await getMonitorById(userId, monitorId);

  const { rows } = await pool.query(
    `SELECT * FROM monitor_checks 
     WHERE monitor_id = $1 
     ORDER BY checked_at DESC 
     LIMIT $2 OFFSET $3`,
    [monitorId, limit, offset],
  );

  return rows;
}
