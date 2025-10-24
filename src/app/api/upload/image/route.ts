import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 이미지 저장 디렉토리
const IMAGES_DIR = path.join(process.cwd(), "public", "uploads");

// 이미지 디렉토리 생성
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

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

    // Base64 데이터에서 실제 이미지 데이터 추출
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 파일명 생성 (타임스탬프 + 랜덤)
    const filename = `image_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);

    // 파일 저장
    fs.writeFileSync(filepath, buffer);

    // 접근 가능한 URL 반환
    const imageUrl = `/uploads/${filename}`;

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
