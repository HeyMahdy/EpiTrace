import { Redis } from 'ioredis';


const myRedisConnection = new Redis({
  host: '',
  port: 0,
  password: "",
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null
});

export default myRedisConnection;