import { z } from "zod";

export const sendAlertSchema = z.object({
  monitorId: z.uuid(),
  url: z.url(),
  repo_link: z.url().optional(),
  status: z.enum(["UP", "DOWN"]),
  error_message: z.string().optional(),
  status_code: z.number().optional(),
  timestamp: z.string().iso.datetime().optional(),
});
