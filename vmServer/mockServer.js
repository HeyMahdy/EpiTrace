require("dotenv").config();

const http = require("http");
const { Queue } = require("bullmq");
const myRedisConnection = require("./radis.config");

const PORT = Number(process.env.MOCK_SERVER_PORT || 9090);
const codeQueue = new Queue("code_queue", { connection: myRedisConnection });

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true, service: "mock-server" });
  }

  if (req.method === "POST" && req.url === "/mock/code-result") {
    try {
      const body = await readJsonBody(req);
      console.log("[mock/code-result] received:", body);
      return sendJson(res, 200, { ok: true, received: body });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }
  }

  if (req.method === "POST" && req.url === "/mock/enqueue-code-job") {
    try {
      const body = await readJsonBody(req);
      const agent_message = body.agent_message;
      const git_hub_repo = body.git_hub_repo;

      if (!agent_message || !git_hub_repo) {
        return sendJson(res, 422, {
          ok: false,
          error: "agent_message and git_hub_repo are required",
        });
      }

      const job = await codeQueue.add("code-job", {
        agent_message,
        git_hub_repo,
      });

      console.log(`[mock/enqueue-code-job] queued job id=${job.id}`);
      return sendJson(res, 200, { ok: true, jobId: job.id });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/mock/code-result`);
  console.log(`POST http://localhost:${PORT}/mock/enqueue-code-job`);
});

function shutdown() {
  server.close(() => {
    codeQueue.close().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
