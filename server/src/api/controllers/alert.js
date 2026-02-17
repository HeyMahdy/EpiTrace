import { ZodError } from "zod";
import { sendAlertSchema } from "../validators/alert.js";
import { sendAlert } from "../../services/notification.js";

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
