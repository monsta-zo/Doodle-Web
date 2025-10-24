import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 분석 데이터 파일 경로
const ANALYTICS_FILE = path.join(process.cwd(), "data", "analytics.json");

// 데이터 디렉토리 생성
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
function readAnalytics() {
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      return defaultAnalytics;
    }
    const data = fs.readFileSync(ANALYTICS_FILE, "utf8");
    return JSON.parse(data);
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
function writeAnalytics(data: AnalyticsData) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing analytics:", error);
  }
}

// 이벤트 기록
export async function POST(request: Request) {
  try {
    const { event } = await request.json();

    const analytics = readAnalytics();

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
    writeAnalytics(analytics);

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
    const analytics = readAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
