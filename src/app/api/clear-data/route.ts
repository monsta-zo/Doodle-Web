import { NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

// Redis 데이터 초기화 API
export async function POST() {
  try {
    // 모든 데이터 삭제
    await redis.flushall();

    return NextResponse.json({
      success: true,
      message: "All Redis data has been cleared",
    });
  } catch (error) {
    console.error("Error clearing Redis data:", error);
    return NextResponse.json(
      { error: "Failed to clear Redis data" },
      { status: 500 }
    );
  }
}

// Redis 데이터 상태 확인
export async function GET() {
  try {
    const keys = await redis.keys("*");
    const data: Record<string, any> = {};

    for (const key of keys) {
      const value = await redis.get(key);
      data[key] = value;
    }

    return NextResponse.json({
      success: true,
      keys,
      data,
    });
  } catch (error) {
    console.error("Error fetching Redis data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Redis data" },
      { status: 500 }
    );
  }
}
