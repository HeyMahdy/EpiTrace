import { pool } from "../config/db.js";

function mapTokenRow(row) {
  return {
    ...row,
    token_last4: row.token_last4 || null,
  };
}

/**
 * Create a GitHub token for a user
 */
export async function createUserGithubToken(userId, data) {
  const { access_token } = data;

  const userResult = await pool.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [
    userId,
  ]);

  if (!userResult.rows.length) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const { rows } = await pool.query(
    `INSERT INTO user_github_tokens (user_id, access_token, is_active)
     VALUES ($1, $2, true)
     RETURNING id, user_id, is_active, created_at, updated_at, RIGHT(access_token, 4) AS token_last4`,
    [userId, access_token],
  );

  return mapTokenRow(rows[0]);
}

/**
 * Get all GitHub tokens for a user
 */
export async function getUserGithubTokens(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, is_active, created_at, updated_at, RIGHT(access_token, 4) AS token_last4
     FROM user_github_tokens
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows.map(mapTokenRow);
}

/**
 * Get GitHub token by ID and verify ownership
 */
export async function getUserGithubTokenById(userId, tokenId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, is_active, created_at, updated_at, RIGHT(access_token, 4) AS token_last4
     FROM user_github_tokens
     WHERE id = $1 AND user_id = $2`,
    [tokenId, userId],
  );

  if (!rows.length) throw new Error("GitHub token not found");
  return mapTokenRow(rows[0]);
}

/**
 * Update GitHub token
 */
export async function updateUserGithubToken(userId, tokenId, data) {
  const allowedFields = ["access_token", "is_active"];
  const fields = Object.keys(data).filter((key) => allowedFields.includes(key));

  if (!fields.length) throw new Error("No valid fields to update");

  const setClause = fields.map((field, idx) => `${field} = $${idx + 3}`).join(", ");
  const values = fields.map((field) => data[field]);

  const { rows } = await pool.query(
    `UPDATE user_github_tokens
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, is_active, created_at, updated_at, RIGHT(access_token, 4) AS token_last4`,
    [tokenId, userId, ...values],
  );

  if (!rows.length) throw new Error("GitHub token not found");
  return mapTokenRow(rows[0]);
}

/**
 * Delete GitHub token
 */
export async function deleteUserGithubToken(userId, tokenId) {
  const { rowCount } = await pool.query(
    `DELETE FROM user_github_tokens
     WHERE id = $1 AND user_id = $2`,
    [tokenId, userId],
  );

  if (!rowCount) throw new Error("GitHub token not found");
}

/**
 * Associate GitHub token with monitor
 */
export async function addGithubTokenToMonitor(monitorId, tokenId) {
  const { rows } = await pool.query(
    `INSERT INTO monitor_github_tokens (monitor_id, github_token_id)
     VALUES ($1, $2)
     RETURNING *`,
    [monitorId, tokenId],
  );

  return rows[0];
}

/**
 * Remove GitHub token from monitor
 */
export async function removeGithubTokenFromMonitor(monitorId, tokenId) {
  const { rowCount } = await pool.query(
    `DELETE FROM monitor_github_tokens
     WHERE monitor_id = $1 AND github_token_id = $2`,
    [monitorId, tokenId],
  );

  if (!rowCount) throw new Error("Monitor GitHub token association not found");
}

/**
 * Get GitHub tokens associated with a monitor
 */
export async function getGithubTokensForMonitor(monitorId) {
  const { rows } = await pool.query(
    `SELECT ugt.id, ugt.user_id, ugt.is_active, ugt.created_at, ugt.updated_at, RIGHT(ugt.access_token, 4) AS token_last4
     FROM monitor_github_tokens mgt
     INNER JOIN user_github_tokens ugt ON ugt.id = mgt.github_token_id
     WHERE mgt.monitor_id = $1
     ORDER BY mgt.created_at DESC`,
    [monitorId],
  );

  return rows.map(mapTokenRow);
}

/**
 * Get the active GitHub access token associated with a monitor
 */
export async function getActiveGithubTokenForMonitor(monitorId) {
  const { rows } = await pool.query(
    `SELECT ugt.access_token
     FROM user_github_tokens ugt
     INNER JOIN monitor_github_tokens mgt ON mgt.github_token_id = ugt.id
     WHERE mgt.monitor_id = $1
       AND ugt.is_active = true
     ORDER BY mgt.created_at DESC
     LIMIT 1`,
    [monitorId],
  );

  return rows[0]?.access_token || null;
}
