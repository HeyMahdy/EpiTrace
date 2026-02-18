import { Queue, QueueEvents } from "bullmq";
import { connection } from "../config/redis.js";

export const downQueue = new Queue("down-monitors", {
  connection,
});

const downQueueEvents = new QueueEvents("down-monitors", { connection });

downQueueEvents.on("waiting", ({ jobId }) => {
  console.log(`[down-monitors] waiting job id=${jobId}`);
});

downQueueEvents.on("active", ({ jobId, prev }) => {
  console.log(`[down-monitors] active job id=${jobId} prev=${prev}`);
});

downQueueEvents.on("completed", ({ jobId }) => {
  console.log(`[down-monitors] completed job id=${jobId}`);
});

downQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`[down-monitors] failed job id=${jobId} reason=${failedReason}`);
});

downQueueEvents.on("error", (error) => {
  console.error("[down-monitors] queue events error:", error.message);
});
