import express from "express";
import { analysisRequestsQueue } from "../../queue/producer.js";

const router = express.Router();

function formatErrorDetails(error, incidentId) {
  const header = `${error?.name ?? "Error"}: ${error?.message ?? "unknown error"}`;
  const stack = typeof error?.stack === "string" ? error.stack : "no stack";
  return [
    header,
    stack,
    `incident_id=${incidentId}`,
    `source=error-job-demo`,
  ].join("\n");
}

router.post("/demo/error-job", async (req, res) => {
  const incidentId = `incident-${Date.now()}`;
  const repoUrl = req.body?.repo_url;

  if (typeof repoUrl !== "string" || !repoUrl.trim()) {
    res.status(400).json({
      ok: false,
      message: "repo_url is required in the request body",
      incidentId,
    });
    return;
  }

  try {
    // Intentional error: assumes nested fields exist.
    const nameLength = req.body.user.profile.name.length;

    res.status(200).json({
      ok: true,
      nameLength,
      incidentId,
    });
  } catch (error) {
    const errorDetails = formatErrorDetails(error, incidentId);

    await analysisRequestsQueue.add("analysis-request", {
      incident_id: incidentId,
      error_details: errorDetails,
      repo_url: repoUrl,
      source: "error-job-demo",
    });

    res.status(500).json({
      ok: false,
      message: "Intentional demo error captured and queued",
      incidentId,
    });
  }
});

export default router;
