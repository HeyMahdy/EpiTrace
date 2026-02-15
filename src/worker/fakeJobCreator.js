import { analysisRequestsQueue } from "../queue/producer.js";
import myRedisConnection from "../queue/config.js";
const totalJobs = Number(process.argv[2] ?? 5);
const repoUrl =
  process.argv[3] ??
  process.env.REPO_URL ??
  "https://github.com/HeyMahdy/test-repo-for-ai-agent.git";

function makeFakeErrorDetails(index) {
  return [
    `Error: User not found`,
    `PUT /users/:id`,
    `request_id=req_${Date.now()}_${index}`,
  ].join("\n");
}

async function run() {
  if (!Number.isInteger(totalJobs) || totalJobs <= 0) {
    throw new Error("Usage: node src/worker/fakeJobCreator.js <positive_job_count>");
  }
  if (typeof repoUrl !== "string" || !repoUrl.trim()) {
    throw new Error(
      "Usage: node src/worker/fakeJobCreator.js <positive_job_count> <repo_url>",
    );
  }

  console.log(`[fake-job-creator] Enqueuing ${totalJobs} fake jobs...`);

  for (let i = 1; i <= totalJobs; i += 1) {
    const incidentId = `incident-${Date.now()}-${i}`;
    const errorDetails = makeFakeErrorDetails(i);

    const job = await analysisRequestsQueue.add("analysis-request", {
      incident_id: incidentId,
      error_details: errorDetails,
      repo_url: repoUrl,
      source: "fake-job-creator",
    });

    console.log(
      `[fake-job-creator] Enqueued job ${job.id} for incident ${incidentId}`,
    );
  }

  await analysisRequestsQueue.close();
  await myRedisConnection.quit();
  console.log("[fake-job-creator] Done");
}

run().catch(async (error) => {
  console.error("[fake-job-creator] Failed:", error.message);
  try {
    await analysisRequestsQueue.close();
    await myRedisConnection.quit();
  } catch {
    // Best effort cleanup.
  }
  process.exit(1);
});
