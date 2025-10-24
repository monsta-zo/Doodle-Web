import { NextResponse } from "next/server";
import { KVStore } from "@/lib/kv-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    console.log("POST /api/posts/[id]/like called for postId:", postId);

    // 임시 사용자 ID (실제로는 세션에서 가져와야 함)
    const userId = "anonymous_user";

    const result = await KVStore.addLike(postId, userId);
    console.log("Add like result:", result);

    if (!result.success) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      likeCount: result.likeCount,
    });
  } catch (error) {
    console.error("Error updating like:", error);
    return NextResponse.json(
      { message: "Failed to update like" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    console.log("GET /api/posts/[id]/like called for postId:", postId);

    const post = await KVStore.findPost(postId);

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      likeCount: post.likeCount || 0,
    });
  } catch (error) {
    console.error("Error fetching like data:", error);
    return NextResponse.json(
      { message: "Failed to fetch like data" },
      { status: 500 }
    );
  }
}
