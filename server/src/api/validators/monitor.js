import { z } from "zod";

export const createMonitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.url("Invalid URL format"),
  repo_link: z.url("Invalid repo link format"),
  method: z.enum(
    ["GET", "POST", "PUT", "DELETE", "PATCH"],
    "Invalid HTTP method",
  ),
  request_header: z.record(z.any()).optional(),
  request_body: z.any().optional(),
  is_active: z.boolean().optional(),
  check_interval: z
    .number()
    .int()
    .min(10, "Check interval must be at least 10 seconds"),
  timeout: z.number().int().min(1, "Timeout must be at least 1 second"),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.url().optional(),
  repo_link: z.url().optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
  request_header: z.record(z.any()).optional(),
  request_body: z.any().optional(),
  check_interval: z.number().int().min(10).optional(),
  timeout: z.number().int().min(1).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});
