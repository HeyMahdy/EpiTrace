import "dotenv/config";
import jwt from "jsonwebtoken";
import queryDB from "../../config/db.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const tokenUserId = payload?.userId;

    if (!tokenUserId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { rows } = await queryDB("SELECT id FROM users WHERE id = $1 LIMIT 1", [
      tokenUserId,
    ]);

    if (!rows.length) {
      return res.status(401).json({
        error: "Invalid token user",
      });
    }

    req.user = { id: rows[0].id };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}