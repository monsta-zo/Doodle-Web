// 메모리 기반 임시 저장소 (서버리스 환경용)
// 주의: 실제 프로덕션에서는 데이터베이스 사용 권장

interface Post {
  id: string;
  text: string;
  image: string | null;
  location: { latitude: number; longitude: number } | null;
  timestamp: string;
  author: string;
  likes: any[];
  likeCount: number;
}

// 전역 메모리 저장소 (서버리스 함수 간 공유되지 않음)
let postsStore: Post[] = [];

export const memoryStore = {
  // 모든 포스트 가져오기
  getPosts(): Post[] {
    return postsStore;
  },

  // 포스트 추가
  addPost(post: Post): void {
    postsStore.unshift(post);
  },

  // 포스트 업데이트
  updatePost(postId: string, updates: Partial<Post>): boolean {
    const index = postsStore.findIndex((post) => post.id === postId);
    if (index !== -1) {
      postsStore[index] = { ...postsStore[index], ...updates };
      return true;
    }
    return false;
  },

  // 포스트 찾기
  findPost(postId: string): Post | undefined {
    return postsStore.find((post) => post.id === postId);
  },

  // 포스트 삭제
  deletePost(postId: string): boolean {
    const index = postsStore.findIndex((post) => post.id === postId);
    if (index !== -1) {
      postsStore.splice(index, 1);
      return true;
    }
    return false;
  },

  // 저장소 초기화
  clear(): void {
    postsStore = [];
  },
};

export type { Post };
