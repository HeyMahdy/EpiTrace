import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const analysisQueue = new Queue("analysis-requests", {
  connection,
});
