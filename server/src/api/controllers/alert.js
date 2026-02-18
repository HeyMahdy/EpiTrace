import { ZodError } from "zod";
import { sendAlertSchema } from "../validators/alert.js";
import { sendAlert } from "../../services/notification.js";
import { connection } from "../../config/redis.js";
import { codeQueue } from "../../queue/codeQueue.js";

export async function sendAlertController(req, res) {
  try {
    const data = sendAlertSchema.parse(req.body);
    await sendAlert(data);

    return res.status(200).json({
      success: true,
      message: "Alert sent",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    console.error("Failed to send alert:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send alert",
    });
  }
}

export async function triggerCodeAgentController(req, res) {
  try {
    const jobId = String(req.query.jobId || "").trim();
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "jobId query param is required",
      });
    }

    const triggerKey = `agent-trigger:${jobId}`;
    const rawPayload = await connection.get(triggerKey);
    if (!rawPayload) {
      return res.status(404).json({
        success: false,
        error: "No trigger payload found for this jobId",
      });
    }

    const payload = JSON.parse(rawPayload);
    const queueJob = await codeQueue.add("code-job", payload, {
      jobId: `code-agent:${jobId}`,
    });

    return res.status(202).json({
      success: true,
      status: "Agent Started",
      sourceJobId: jobId,
      queueJobId: queueJob.id,
    });
  } catch (error) {
    console.error("Failed to trigger code agent:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to trigger code agent",
    });
  }
}
