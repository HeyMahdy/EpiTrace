import queryDB from "../config/db.js";

export async function createMonitor(userId, data) {
  const {
    name,
    url,
    method,
    request_header = {},
    request_body = {},
    check_interval,
    timeout,
  } = data;

  const query = `
        INSERT INTO monitors
        (user_id, name, url, method, request_header,
        request_body, check_interval, timeout)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

  const values = [
    userId,
    name,
    url,
    method,
    request_header,
    request_body,
    check_interval,
    timeout,
  ];

  const result = await queryDB(query, values);

  return result.rows[0];
}
