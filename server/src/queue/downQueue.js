import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const downQueue = new Queue("down-monitors", {
  connection,
});