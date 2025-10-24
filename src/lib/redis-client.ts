import { Redis } from "@upstash/redis";

// 기존 환경변수를 사용해서 Redis 클라이언트 생성
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export { redis };
