import { redis } from "./redis-client";

export interface Post {
  id: string;
  text: string;
  image: string | null;
  location: { latitude: number; longitude: number } | null;
  timestamp: string;
  author: string;
  likes: string[];
  likeCount: number;
}

export class KVStore {
  private static readonly POSTS_KEY = "posts";
  private static readonly POST_KEY_PREFIX = "post:";

  // 모든 포스트 가져오기
  static async getPosts(): Promise<Post[]> {
    try {
      console.log("KVStore.getPosts called");
      const postIds = await redis.lrange(this.POSTS_KEY, 0, -1);
      console.log("Post IDs from Redis:", postIds);

      if (!postIds || postIds.length === 0) {
        console.log("No posts found");
        return [];
      }

      const posts: Post[] = [];
      for (const id of postIds) {
        const post = await redis.get<Post>(`${this.POST_KEY_PREFIX}${id}`);
        if (post) {
          posts.push(post);
        }
      }

      // 최신순으로 정렬
      const sortedPosts = posts.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log("Retrieved posts:", sortedPosts.length);
      return sortedPosts;
    } catch (error) {
      console.error("Error getting posts:", error);
      return [];
    }
  }

  // 포스트 추가
  static async addPost(post: Post): Promise<void> {
    try {
      console.log("KVStore.addPost called with:", post);

      // 포스트 데이터 저장
      console.log("Setting post data...");
      await redis.set(`${this.POST_KEY_PREFIX}${post.id}`, post);
      console.log("Post data set successfully");

      // 포스트 ID를 리스트에 추가 (최신순으로)
      console.log("Adding post ID to list...");
      await redis.lpush(this.POSTS_KEY, post.id);
      console.log("Post ID added to list successfully");
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  }

  // 포스트 업데이트
  static async updatePost(
    postId: string,
    updates: Partial<Post>
  ): Promise<boolean> {
    try {
      const existingPost = await redis.get<Post>(
        `${this.POST_KEY_PREFIX}${postId}`
      );
      if (!existingPost) {
        return false;
      }

      const updatedPost = { ...existingPost, ...updates };
      await redis.set(`${this.POST_KEY_PREFIX}${postId}`, updatedPost);
      return true;
    } catch (error) {
      console.error("Error updating post:", error);
      return false;
    }
  }

  // 포스트 찾기
  static async findPost(postId: string): Promise<Post | null> {
    try {
      return await redis.get<Post>(`${this.POST_KEY_PREFIX}${postId}`);
    } catch (error) {
      console.error("Error finding post:", error);
      return null;
    }
  }

  // 포스트 삭제
  static async deletePost(postId: string): Promise<boolean> {
    try {
      const exists = await redis.exists(`${this.POST_KEY_PREFIX}${postId}`);
      if (!exists) {
        return false;
      }

      // 포스트 데이터 삭제
      await redis.del(`${this.POST_KEY_PREFIX}${postId}`);

      // 포스트 ID를 리스트에서 제거
      await redis.lrem(this.POSTS_KEY, 0, postId);

      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  }

  // 좋아요 토글
  static async toggleLike(
    postId: string,
    userId: string
  ): Promise<{ success: boolean; likeCount: number }> {
    try {
      const post = await this.findPost(postId);
      if (!post) {
        return { success: false, likeCount: 0 };
      }

      const isLiked = post.likes.includes(userId);
      let newLikes: string[];
      let newLikeCount: number;

      if (isLiked) {
        // 좋아요 취소
        newLikes = post.likes.filter((id) => id !== userId);
        newLikeCount = Math.max(0, post.likeCount - 1);
      } else {
        // 좋아요 추가
        newLikes = [...post.likes, userId];
        newLikeCount = post.likeCount + 1;
      }

      await this.updatePost(postId, {
        likes: newLikes,
        likeCount: newLikeCount,
      });

      return { success: true, likeCount: newLikeCount };
    } catch (error) {
      console.error("Error toggling like:", error);
      return { success: false, likeCount: 0 };
    }
  }
}
