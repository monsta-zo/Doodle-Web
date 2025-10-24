"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalPageViews: number;
  locationPermissionRequests: number;
  locationPermissionsGranted: number;
  locationPermissionsDenied: number;
  postsCreated: number;
  likesClicked: number;
  lastUpdated: string;
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 분석 데이터 불러오기
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // 5초마다 데이터 새로고침
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  // 계산된 지표들
  const successRate =
    analytics.locationPermissionRequests > 0
      ? Math.round(
          (analytics.locationPermissionsGranted /
            analytics.locationPermissionRequests) *
            100
        )
      : 0;

  const failureRate =
    analytics.locationPermissionRequests > 0
      ? Math.round(
          (analytics.locationPermissionsDenied /
            analytics.locationPermissionRequests) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
        {/* 로고 및 이름 */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Doodle Admin</h1>
          </div>
        </div>

        {/* 뒤로가기 버튼 */}
        <Link
          href="/"
          className="flex items-center space-x-2 px-3 py-[6] bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
        >
          <span className="text-gray-300 text-sm">←</span>
          <span className="text-gray-300 text-sm font-medium">메인으로</span>
        </Link>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            사용자 분석 대시보드
          </h1>
          <p className="text-gray-400">
            마지막 업데이트:{" "}
            {new Date(analytics.lastUpdated).toLocaleString("ko-KR")}
          </p>
        </div>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {/* 총 접속 수 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">총 접속 수</h3>
              <span className="text-lg">👥</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics.totalPageViews}
            </p>
          </div>

          {/* 위치 인증 버튼 누른 수 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">위치 인증 요청</h3>
              <span className="text-lg">📍</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics.locationPermissionRequests}
            </p>
          </div>

          {/* 허용한 사람 수 */}
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-green-400">허용한 사람</h3>
              <span className="text-lg">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-400">
              {analytics.locationPermissionsGranted}
            </p>
            <p className="text-xs text-green-300 mt-1">{successRate}% 성공률</p>
          </div>

          {/* 거부한 사람 수 */}
          <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-red-400">거부한 사람</h3>
              <span className="text-lg">❌</span>
            </div>
            <p className="text-3xl font-bold text-red-400">
              {analytics.locationPermissionsDenied}
            </p>
            <p className="text-xs text-red-300 mt-1">{failureRate}% 거부률</p>
          </div>

          {/* 글 올린 사람 수 */}
          <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-blue-400">글 작성</h3>
              <span className="text-lg">✍️</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {analytics.postsCreated}
            </p>
          </div>

          {/* 좋아요 누른 수 */}
          <div className="bg-pink-500/10 rounded-xl p-6 border border-pink-500/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-pink-400">좋아요 클릭</h3>
              <span className="text-lg">❤️</span>
            </div>
            <p className="text-3xl font-bold text-pink-400">
              {analytics.likesClicked}
            </p>
          </div>
        </div>

        {/* 추가 통계 */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
          <h2 className="text-xl font-bold text-white mb-4">📊 상세 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-gray-400 mb-2">참여율</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">위치 인증 요청률</span>
                  <span className="text-white font-semibold">
                    {analytics.totalPageViews > 0
                      ? Math.round(
                          (analytics.locationPermissionRequests /
                            analytics.totalPageViews) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">글 작성률</span>
                  <span className="text-white font-semibold">
                    {analytics.totalPageViews > 0
                      ? Math.round(
                          (analytics.postsCreated / analytics.totalPageViews) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">좋아요 참여률</span>
                  <span className="text-white font-semibold">
                    {analytics.totalPageViews > 0
                      ? Math.round(
                          (analytics.likesClicked / analytics.totalPageViews) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-2">활동 지표</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">글당 평균 좋아요</span>
                  <span className="text-white font-semibold">
                    {analytics.postsCreated > 0
                      ? Math.round(
                          (analytics.likesClicked / analytics.postsCreated) * 10
                        ) / 10
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">인증 성공률</span>
                  <span className="text-white font-semibold">
                    {successRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            🔄 데이터 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
