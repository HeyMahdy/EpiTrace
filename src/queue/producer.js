import { Queue } from "bullmq";
import myRedisConnection from "./config.js";

export const ANALYSIS_REQUESTS_QUEUE_NAME = "analysis-requests";

export const analysisRequestsQueue = new Queue(ANALYSIS_REQUESTS_QUEUE_NAME, {
  connection: myRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export default analysisRequestsQueue;
