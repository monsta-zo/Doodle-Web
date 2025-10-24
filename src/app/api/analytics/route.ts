import { NextResponse } from "next/server";
import { redis } from "@/lib/redis-client";

// Redis 키
const ANALYTICS_KEY = "analytics";

// 기본 분석 데이터 구조
const defaultAnalytics = {
  totalPageViews: 0,
  locationPermissionRequests: 0,
  locationPermissionsGranted: 0,
  locationPermissionsDenied: 0,
  postsCreated: 0,
  likesClicked: 0,
  lastUpdated: new Date().toISOString(),
};

// 분석 데이터 읽기
async function readAnalytics() {
  try {
    const data = await redis.get(ANALYTICS_KEY);
    return data ? JSON.parse(data as string) : defaultAnalytics;
  } catch (error) {
    console.error("Error reading analytics:", error);
    return defaultAnalytics;
  }
}

interface AnalyticsData {
  totalPageViews: number;
  locationPermissionRequests: number;
  locationPermissionsGranted: number;
  locationPermissionsDenied: number;
  postsCreated: number;
  likesClicked: number;
  lastUpdated: string;
}

// 분석 데이터 저장
async function writeAnalytics(data: AnalyticsData) {
  try {
    await redis.set(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing analytics:", error);
  }
}

// 이벤트 기록
export async function POST(request: Request) {
  try {
    const { event } = await request.json();

    const analytics = await readAnalytics();

    switch (event) {
      case "page_view":
        analytics.totalPageViews += 1;
        break;
      case "location_permission_requested":
        analytics.locationPermissionRequests += 1;
        break;
      case "location_permission_granted":
        analytics.locationPermissionsGranted += 1;
        break;
      case "location_permission_denied":
        analytics.locationPermissionsDenied += 1;
        break;
      case "post_created":
        analytics.postsCreated += 1;
        break;
      case "like_clicked":
        analytics.likesClicked += 1;
        break;
      default:
        console.log("Unknown event:", event);
    }

    analytics.lastUpdated = new Date().toISOString();
    await writeAnalytics(analytics);

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
