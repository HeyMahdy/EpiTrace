import { z } from "zod";

export const sendAlertSchema = z.object({
  monitorId: z.string().uuid(),
  url: z.string().url(),
  repo_link: z.string().url().optional(),
  status: z.enum(["UP", "DOWN"]),
  error_message: z.string().optional(),
  status_code: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});
