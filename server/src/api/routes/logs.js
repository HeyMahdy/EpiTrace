import express from "express";

const router = express.Router();

const clients = new Set();
const logBuffer = [];
const MAX_BUFFER_SIZE = 500;
const HEARTBEAT_MS = 15000;

function isTestLog(message = "") {
  return /(jest|vitest|mocha|pytest|unit test|tests? passed|tests? failed|\bPASS\b|\bFAIL\b)/i.test(
    message,
  );
}

function toPretty(entry) {
  const ts = new Date(entry.ts).toISOString();
  const level = String(entry.level || "info").toUpperCase().padEnd(5, " ");
  const stage = String(entry.stage || "runtime").toUpperCase().padEnd(9, " ");
  const job = entry.jobId ? `job=${entry.jobId}` : "job=-";
  return `[${ts}] [${level}] [${stage}] [${job}] ${entry.message}`;
}

function sendSse(client, event, payload) {
  client.res.write(`event: ${event}\n`);
  client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(event, payload) {
  for (const client of clients) {
    if (client.jobId && String(client.jobId) !== String(payload.jobId || "")) {
      continue;
    }
    sendSse(client, event, payload);
  }
}

router.post("/code-worker", (req, res) => {
  const body = req.body || {};
  if (!body.message || typeof body.message !== "string") {
    return res.status(400).json({
      success: false,
      error: "message (string) is required",
    });
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    ts: new Date().toISOString(),
    worker: "code_queue",
    level: body.level || "info",
    stage: body.stage || "runtime",
    category: body.category || (isTestLog(body.message) ? "unit_test" : "runtime"),
    jobId: body.jobId || null,
    repo: body.repo || null,
    message: body.message,
  };

  entry.pretty = toPretty(entry);
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) logBuffer.shift();

  broadcast("log", entry);

  return res.status(202).json({ success: true });
});

router.get("/code-worker/stream", (req, res) => {
  const jobId = req.query.jobId ? String(req.query.jobId) : "";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const client = { res, jobId };
  clients.add(client);

  sendSse(client, "connected", {
    success: true,
    message: jobId ? `Connected to code-worker log stream for job ${jobId}` : "Connected to code-worker log stream",
    filters: { jobId: jobId || null },
  });

  for (const entry of logBuffer) {
    if (jobId && String(entry.jobId || "") !== jobId) continue;
    sendSse(client, "log", entry);
  }

  const heartbeat = setInterval(() => {
    sendSse(client, "heartbeat", { ts: new Date().toISOString() });
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
    res.end();
  });
});

export default router;
