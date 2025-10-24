import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const postsFilePath = path.join(process.cwd(), "data", "posts.json");

interface Post {
  id: string;
  text: string;
  image: string | null;
  location: any;
  timestamp: string;
  author: string;
  likes: any[];
  likeCount: number;
}

async function readPosts(): Promise<Post[]> {
  try {
    const data = await fs.readFile(postsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
      await fs.writeFile(postsFilePath, "[]", "utf-8");
      return [];
    }
    throw error;
  }
}

async function writePosts(posts: Post[]): Promise<void> {
  await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), "utf-8");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const posts = await readPosts();
    const postIndex = posts.findIndex((post) => post.id === postId);

    if (postIndex === -1) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const post = posts[postIndex];

    // 좋아요 수 증가
    post.likeCount = (post.likeCount || 0) + 1;

    await writePosts(posts);

    return NextResponse.json({
      success: true,
      likeCount: post.likeCount,
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
    const posts = await readPosts();
    const post = posts.find((post) => post.id === postId);

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
