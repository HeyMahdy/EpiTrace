import { Worker } from "bullmq";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ANALYSIS_REQUESTS_QUEUE_NAME } from "../queue/producer.js";
import myRedisConnection from "../queue/config.js";
import investigateIncident from "./investigator.js";

export const analysisRequestsWorker = new Worker(
  ANALYSIS_REQUESTS_QUEUE_NAME,
  async (job) => {
    console.log(
      `[analysis-requests] Processing job ${job.id} (${job.name})`,
      job.data,
    );

    const incidentId = String(job.data?.incident_id ?? job.id);
    const errorDetails = job.data?.error_details;
    const repoUrl = job.data?.repo_url;

    if (typeof errorDetails !== "string") {
      throw new Error("Job payload must include error_details as a string");
    }
    if (typeof repoUrl !== "string" || !repoUrl.trim()) {
      throw new Error("Job payload must include repo_url as a non-empty string");
    }

    const safeIncidentId = incidentId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const incidentDir = path.resolve(process.cwd(), "tmp", safeIncidentId);
    const promptPath = path.join(incidentDir, "prompt.txt");

    await mkdir(incidentDir, { recursive: true });
    await writeFile(promptPath, errorDetails, "utf8");

    const investigationResult = await investigateIncident({
      incidentId: safeIncidentId,
      incidentDir,
      promptPath,
      repoUrl,
    });

    return {
      status: "processed",
      jobId: job.id,
      incidentId: safeIncidentId,
      promptPath,
      reportPath: investigationResult.reportPath,
      dockerImage: investigationResult.dockerImage,
    };
  },
  {
    connection: myRedisConnection,
    concurrency: 5,
  },
);

analysisRequestsWorker.on("completed", (job) => {
  console.log(`[analysis-requests] Completed job ${job.id}`);
});

analysisRequestsWorker.on("failed", (job, error) => {
  console.error(
    `[analysis-requests] Failed job ${job?.id ?? "unknown"}:`,
    error.message,
  );
});

analysisRequestsWorker.on("error", (error) => {
  console.error("[analysis-requests] Worker error:", error.message);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[analysis-requests] Received ${signal}. Closing worker...`);

  try {
    await analysisRequestsWorker.close();
    await myRedisConnection.quit();
    console.log("[analysis-requests] Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("[analysis-requests] Shutdown failed:", error);
    process.exit(1);
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export default analysisRequestsWorker;
