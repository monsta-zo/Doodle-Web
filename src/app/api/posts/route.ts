import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 데이터 파일 경로
const DATA_FILE = path.join(process.cwd(), "data", "posts.json");

// 데이터 디렉토리 생성
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 글 목록 조회
export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json([]);
    }

    const data = fs.readFileSync(DATA_FILE, "utf8");
    const posts = JSON.parse(data);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error reading posts:", error);
    return NextResponse.json(
      { error: "Failed to read posts" },
      { status: 500 }
    );
  }
}

// 새 글 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, image, location } = body;

    // 유효성 검사
    if (!text && !image) {
      return NextResponse.json(
        { error: "Text or image is required" },
        { status: 400 }
      );
    }

    // 기존 글 목록 읽기
    let posts = [];
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      posts = JSON.parse(data);
    }

    // 새 글 생성
    const newPost = {
      id: Date.now().toString(),
      text: text || "",
      image: image || null,
      location: location || null,
      timestamp: new Date().toISOString(),
      author: "익명의 방문자", // 나중에 익명 시스템으로 개선
      likes: [],
      likeCount: 0,
    };

    // 글 목록에 추가
    posts.unshift(newPost); // 최신 글이 위에 오도록

    // 파일에 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
