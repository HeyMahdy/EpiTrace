import "dotenv/config";
import { Redis } from 'ioredis';


export const connection = new Redis({
host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null

});

