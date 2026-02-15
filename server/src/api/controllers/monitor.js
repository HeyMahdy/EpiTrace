import { createMonitor } from "../../services/monitor.js";
import { createMonitorSchema } from "../validators/monitor.js";

export async function createMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const data = createMonitorSchema.parse(req.body);
    const monitor = await createMonitor(userId, data);
    res.status(201).json({
      success: true,
      data: monitor,
    });
  } catch (error) {
    if (error instanceof createMonitorSchema.ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        error: "Invalid user reference",
      });
    }

    console.error("Error creating monitor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
