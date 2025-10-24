import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  try {
    // 환경변수 확인
    const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL;
    const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log("Environment check:", {
      hasUrl,
      hasToken,
      url: process.env.UPSTASH_REDIS_REST_URL ? "SET" : "NOT SET",
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? "SET" : "NOT SET",
    });

    if (!hasUrl || !hasToken) {
      return NextResponse.json(
        {
          error: "Redis environment variables not set",
          hasUrl,
          hasToken,
          envVars: Object.keys(process.env).filter(
            (key) => key.includes("UPSTASH") || key.includes("REDIS")
          ),
        },
        { status: 500 }
      );
    }

    // Redis 연결 테스트
    const redis = Redis.fromEnv();
    await redis.ping();

    return NextResponse.json({
      success: true,
      message: "Redis connection successful",
      hasUrl,
      hasToken,
    });
  } catch (error) {
    console.error("Redis test error:", error);
    return NextResponse.json(
      {
        error: "Redis connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      },
      { status: 500 }
    );
  }
}
