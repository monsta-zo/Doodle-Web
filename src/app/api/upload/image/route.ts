import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // 파일명 생성 (타임스탬프 + 랜덤)
    const filename = `image_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.jpg`;

    // Redis에 Base64 이미지 저장
    await redis.set(`image:${filename}`, imageData);

    // 접근 가능한 URL 반환 (API 엔드포인트로)
    const imageUrl = `/api/image/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
