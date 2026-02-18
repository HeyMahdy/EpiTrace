
import { Redis } from 'ioredis';


export const connection = new Redis({
host: 'handy-gazelle-16467.upstash.io',
  port: 6379,
  password: "AUBTAAIncDFhZDI1NDQwZWM0YWY0NGY0ODVmMDBmNTMxNjkxMTFmMHAxMTY0Njc",
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null

});

