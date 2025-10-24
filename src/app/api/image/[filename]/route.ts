import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const imageData = await redis.get(`image:${filename}`);

    if (!imageData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Base64 데이터를 Buffer로 변환
    const base64Data = (imageData as string).replace(
      /^data:image\/[a-z]+;base64,/,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error retrieving image:", error);
    return NextResponse.json(
      { error: "Failed to retrieve image" },
      { status: 500 }
    );
  }
}
