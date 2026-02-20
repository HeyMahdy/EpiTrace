require("dotenv").config();

const { spawn } = require("child_process");
const { Worker } = require("bullmq");
const axios = require("axios");
const myRedisConnection = require("./radis.config");

const API_BASE_URL = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const CODE_LOG_ENDPOINT = process.env.CODE_LOG_ENDPOINT || `${API_BASE_URL}/logs/code-worker`;

function parseLines(chunk) {
  return String(chunk || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isUnitTestLog(line) {
  return /(jest|vitest|mocha|pytest|unit test|tests? passed|tests? failed|\bPASS\b|\bFAIL\b)/i.test(
    line,
  );
}

async function publishLog(payload) {
  try {
    await axios.post(CODE_LOG_ENDPOINT, payload, { timeout: 2500 });
  } catch (error) {
    // Do not break worker execution if log streaming endpoint is unavailable.
  }
}

const coder_agent = new Worker(
  "code_queue",
  async (Job) => {
    const agent_message = Job.data.agent_message;
    const git_hub_repo = Job.data.git_hub_repo;
    const github_access_token = Job.data.github_access_token;

    await publishLog({
      level: "info",
      stage: "received",
      jobId: Job.id,
      repo: git_hub_repo,
      message: "Job received by code worker.",
    });

    console.log(agent_message);

    const missingFields = [];
    if (!agent_message) missingFields.push("agent_message");
    if (!git_hub_repo) missingFields.push("git_hub_repo");
    if (!github_access_token) missingFields.push("github_access_token");
    if (missingFields.length) {
      await publishLog({
        level: "error",
        stage: "validation",
        jobId: Job.id,
        repo: git_hub_repo,
        message: `Missing required job data: ${missingFields.join(", ")}`,
      });
      throw new Error(
        `Job ${Job.id} is missing required data: ${missingFields.join(", ")}. Payload=${JSON.stringify(
          Job.data,
        )}`,
      );
    }

    return new Promise((resolve, reject) => {
      const child = spawn("bash", ["cline-code-job.sh", agent_message, git_hub_repo, github_access_token]);

      publishLog({
        level: "info",
        stage: "agent",
        jobId: Job.id,
        repo: git_hub_repo,
        message: "Started cline-code-job.sh execution.",
      });

      let fullLogOutput = "";

      child.stdout.on("data", (data) => {
        console.log(`[Logs]: ${data.toString().trim()}`);
        fullLogOutput += data.toString();
        const lines = parseLines(data);
        for (const line of lines) {
          publishLog({
            level: "info",
            stage: isUnitTestLog(line) ? "tests" : "agent",
            category: isUnitTestLog(line) ? "unit_test" : "runtime",
            jobId: Job.id,
            repo: git_hub_repo,
            message: line,
          });
        }
      });

      child.stderr.on("data", (data) => {
        console.error(`[Error/Warning]: ${data.toString().trim()}`);
        const lines = parseLines(data);
        for (const line of lines) {
          publishLog({
            level: "error",
            stage: isUnitTestLog(line) ? "tests" : "agent",
            category: isUnitTestLog(line) ? "unit_test" : "runtime",
            jobId: Job.id,
            repo: git_hub_repo,
            message: line,
          });
        }
      });

      child.on("close", async (code) => {
        if (code !== 0) {
          await publishLog({
            level: "error",
            stage: "agent",
            jobId: Job.id,
            repo: git_hub_repo,
            message: `Script exited with non-zero code: ${code}`,
          });
          reject(new Error(`Bash script failed with exit code ${code}`));
          return;
        }

        console.log(`Job ${Job.id} completed successfully!`);
        await publishLog({
          level: "info",
          stage: "agent",
          jobId: Job.id,
          repo: git_hub_repo,
          message: "Script execution completed successfully.",
        });
        const commitLinkChunk = fullLogOutput.split(":::COMMIT_LINK:::")[1];
        const linkLine = commitLinkChunk
          ? commitLinkChunk
              .trim()
              .split("\n")
              .map((line) => line.trim())
              .find((line) => /^https?:\/\//.test(line))
          : "";
        const commit_link = linkLine || "";

        if (!commit_link) {
          await publishLog({
            level: "error",
            stage: "result",
            jobId: Job.id,
            repo: git_hub_repo,
            message: "No commit/PR link marker found in output.",
          });
          reject(
            new Error(
              `No commit link found in script output for job ${Job.id}. Output=${fullLogOutput}`,
            ),
          );
          return;
        }

        await publishLog({
          level: "info",
          stage: "result",
          category: "summary",
          jobId: Job.id,
          repo: git_hub_repo,
          message: `Job finished. Generated link: ${commit_link}`,
        });
        resolve(commit_link);
      });
    });
  },
  {
    connection: myRedisConnection,
    concurrency: 5,
  },
);

console.log("Code worker running on queue: code_queue");

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down code worker...`);

  try {
    await coder_agent.close();
    await myRedisConnection.quit();
    console.log("code_queue worker shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during code worker shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
