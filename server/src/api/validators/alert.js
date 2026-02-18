import { z } from "zod";

const monitorAlertSchema = z.object({
  monitorId: z.string().uuid(),
  url: z.string().url(),
  repo_link: z.string().url().optional(),
  status: z.enum(["UP", "DOWN"]),
  error_message: z.string().optional(),
  status_code: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

const analysisAlertSchema = z.object({
  extractedAnalysis: z.string().min(1),
  jobId: z.union([z.string(), z.number()]),
  git_hub_repo: z.string().url(),
  error_message: z.string().optional(),
});

export const sendAlertSchema = z.union([analysisAlertSchema, monitorAlertSchema]);
