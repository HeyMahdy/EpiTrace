
import { Redis } from 'ioredis';


export const connection = new Redis({
host: 'innocent-lark-6388.upstash.io',
  port: 6379,
  password: "ARj0AAImcDI5MWJlYTU0NGVlNmM0YzQ3OWMyMTZjN2E5MDVhOGVmM3AyNjM4OA",
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null

});

