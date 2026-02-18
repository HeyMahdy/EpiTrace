import { pool } from "../config/db.js";

/**
 * Create a webhook for a user
 */
export async function createUserWebhook(userId, data) {
  const { provider, webhook_url } = data;

  const { rows } = await pool.query(
    `INSERT INTO user_webhooks (user_id, provider, webhook_url, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [userId, provider, webhook_url]
  );

  return rows[0];
}

/**
 * Get all webhooks for a user
 */
export async function getUserWebhooks(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_webhooks 
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

/**
 * Get webhook by ID and verify ownership
 */
export async function getUserWebhookById(userId, webhookId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_webhooks 
     WHERE id = $1 AND user_id = $2`,
    [webhookId, userId]
  );

  if (!rows.length) throw new Error("Webhook not found");
  return rows[0];
}

/**
 * Update webhook
 */
export async function updateUserWebhook(userId, webhookId, data) {
  const allowedFields = ["provider", "webhook_url", "is_active"];
  const fields = Object.keys(data).filter((k) => allowedFields.includes(k));
  
  if (!fields.length) throw new Error("No valid fields to update");

  const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(", ");
  const values = fields.map((f) => data[f]);

  const { rows } = await pool.query(
    `UPDATE user_webhooks 
     SET ${setClause}, updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [webhookId, userId, ...values]
  );

  if (!rows.length) throw new Error("Webhook not found");
  return rows[0];
}

/**
 * Delete webhook
 */
export async function deleteUserWebhook(userId, webhookId) {
  const { rowCount } = await pool.query(
    `DELETE FROM user_webhooks 
     WHERE id = $1 AND user_id = $2`,
    [webhookId, userId]
  );

  if (!rowCount) throw new Error("Webhook not found");
}

/**
 * Associate webhook with monitor
 */
export async function addWebhookToMonitor(monitorId, webhookId) {
  const { rows } = await pool.query(
    `INSERT INTO monitor_webhooks (monitor_id, webhook_id)
     VALUES ($1, $2)
     RETURNING *`,
    [monitorId, webhookId]
  );

  return rows[0];
}

/**
 * Remove webhook from monitor
 */
export async function removeWebhookFromMonitor(monitorId, webhookId) {
  const { rowCount } = await pool.query(
    `DELETE FROM monitor_webhooks 
     WHERE monitor_id = $1 AND webhook_id = $2`,
    [monitorId, webhookId]
  );

  if (!rowCount) throw new Error("Monitor webhook association not found");
}

/**
 * Get all webhooks configured for a monitor
 */
export async function getMonitorWebhooks(monitorId) {
  const { rows } = await pool.query(
    `SELECT uw.* FROM user_webhooks uw
     INNER JOIN monitor_webhooks mw ON uw.id = mw.webhook_id
     WHERE mw.monitor_id = $1 AND uw.is_active = true
     ORDER BY uw.created_at DESC`,
    [monitorId]
  );

  return rows;
}

/**
 * Check if a webhook belongs to a user
 */
export async function verifyWebhookOwnership(userId, webhookId) {
  const { rows } = await pool.query(
    `SELECT id FROM user_webhooks 
     WHERE id = $1 AND user_id = $2`,
    [webhookId, userId]
  );

  return rows.length > 0;
}
