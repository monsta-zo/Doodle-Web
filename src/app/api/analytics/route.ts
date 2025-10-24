import { NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

// Redis 키들 (각각 개별 키로 관리)
const ANALYTICS_KEYS = {
  totalPageViews: "analytics:totalPageViews",
  locationPermissionRequests: "analytics:locationPermissionRequests",
  locationPermissionsGranted: "analytics:locationPermissionsGranted",
  locationPermissionsDenied: "analytics:locationPermissionsDenied",
  postsCreated: "analytics:postsCreated",
  likesClicked: "analytics:likesClicked",
  lastUpdated: "analytics:lastUpdated",
};

// 분석 데이터 읽기 (개별 키에서 읽어서 조합)
async function readAnalytics() {
  try {
    const [
      totalPageViews,
      locationPermissionRequests,
      locationPermissionsGranted,
      locationPermissionsDenied,
      postsCreated,
      likesClicked,
      lastUpdated,
    ] = await Promise.all([
      redis.get(ANALYTICS_KEYS.totalPageViews),
      redis.get(ANALYTICS_KEYS.locationPermissionRequests),
      redis.get(ANALYTICS_KEYS.locationPermissionsGranted),
      redis.get(ANALYTICS_KEYS.locationPermissionsDenied),
      redis.get(ANALYTICS_KEYS.postsCreated),
      redis.get(ANALYTICS_KEYS.likesClicked),
      redis.get(ANALYTICS_KEYS.lastUpdated),
    ]);

    return {
      totalPageViews: parseInt(totalPageViews as string) || 0,
      locationPermissionRequests:
        parseInt(locationPermissionRequests as string) || 0,
      locationPermissionsGranted:
        parseInt(locationPermissionsGranted as string) || 0,
      locationPermissionsDenied:
        parseInt(locationPermissionsDenied as string) || 0,
      postsCreated: parseInt(postsCreated as string) || 0,
      likesClicked: parseInt(likesClicked as string) || 0,
      lastUpdated: (lastUpdated as string) || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error reading analytics:", error);
    return {
      totalPageViews: 0,
      locationPermissionRequests: 0,
      locationPermissionsGranted: 0,
      locationPermissionsDenied: 0,
      postsCreated: 0,
      likesClicked: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// 개별 카운터 증가 (원자적 연산)
async function incrementCounter(key: string) {
  try {
    return await redis.incr(key);
  } catch (error) {
    console.error(`Error incrementing counter ${key}:`, error);
    return 0;
  }
}

// 이벤트 기록
export async function POST(request: Request) {
  try {
    const { event } = await request.json();

    let counterKey = "";
    switch (event) {
      case "page_view":
        counterKey = ANALYTICS_KEYS.totalPageViews;
        break;
      case "location_permission_requested":
        counterKey = ANALYTICS_KEYS.locationPermissionRequests;
        break;
      case "location_permission_granted":
        counterKey = ANALYTICS_KEYS.locationPermissionsGranted;
        break;
      case "location_permission_denied":
        counterKey = ANALYTICS_KEYS.locationPermissionsDenied;
        break;
      case "post_created":
        counterKey = ANALYTICS_KEYS.postsCreated;
        break;
      case "like_clicked":
        counterKey = ANALYTICS_KEYS.likesClicked;
        break;
      default:
        console.log("Unknown event:", event);
        return NextResponse.json({ success: false, error: "Unknown event" });
    }

    // 원자적 증가 연산 사용
    await incrementCounter(counterKey);

    // lastUpdated 업데이트
    await redis.set(ANALYTICS_KEYS.lastUpdated, new Date().toISOString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// 분석 데이터 조회
export async function GET() {
  try {
    const analytics = await readAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
