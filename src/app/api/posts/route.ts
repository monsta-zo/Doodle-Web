import { NextRequest, NextResponse } from "next/server";
import { KVStore, Post } from "@/lib/kv-store";

// 글 목록 조회
export async function GET() {
  try {
    const posts = await KVStore.getPosts();
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
    console.log("POST request received");

    const body = await request.json();
    console.log("Request body:", body);

    const { text, image, location } = body;

    // 유효성 검사
    if (!text && !image) {
      console.log("Validation failed: no text or image");
      return NextResponse.json(
        { error: "Text or image is required" },
        { status: 400 }
      );
    }

    console.log("Creating new post...");

    // 새 글 생성
    const newPost: Post = {
      id: Date.now().toString(),
      text: text || "",
      image: image || null,
      location: location || null,
      timestamp: new Date().toISOString(),
      author: "익명의 방문자",
      likes: [],
      likeCount: 0,
    };

    console.log("New post created:", newPost);

    // KV 저장소에 추가
    console.log("Adding post to KV store...");
    await KVStore.addPost(newPost);
    console.log("Post added successfully");

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
