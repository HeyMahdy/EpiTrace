const { Redis } = require("ioredis");
require("dotenv").config();

const myRedisConnection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
});

module.exports = myRedisConnection;
