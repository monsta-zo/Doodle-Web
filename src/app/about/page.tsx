"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
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
            <h1 className="text-lg font-bold text-white">Doodle</h1>
          </div>
        </div>

        {/* 뒤로가기 버튼 */}
        <Link
          href="/"
          className="flex items-center space-x-2 px-3 py-[6] bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
        >
          <span className="text-gray-300 text-sm">←</span>
          <span className="text-gray-300 text-sm font-medium">돌아가기</span>
        </Link>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Doodle 소개</h1>
          <p className="text-gray-400">위치 기반 익명 글 공간</p>
        </div>

        {/* 소개 섹션들 */}
        <div className="space-y-6">
          {/* 첫 번째 섹션 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🎓</span>
              <h2 className="text-xl font-bold text-white">
                부산대학교 컴퓨터공학과 졸업생
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              안녕하세요! 저희는 부산대학교 컴퓨터공학과를 졸업한
              개발자들입니다. 새로운 재미를 찾아 나서고 있는 개발자들이에요.
              기술로 사람들과 소통할 수 있는 새로운 방법을 만들어보고 있습니다.
            </p>
          </div>

          {/* 두 번째 섹션 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🔍</span>
              <h2 className="text-xl font-bold text-white">
                새로운 재미를 찾아 나서고 있어요
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              위치 기반 익명 글 공간이라는 새로운 컨셉으로 사람들이 더 자유롭게
              소통할 수 있는 공간을 만들어보고 있어요. 특정 장소에 가야만 글을
              보고 남길 수 있는 독특한 경험을 제공합니다.
            </p>
          </div>

          {/* 세 번째 섹션 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🔒</span>
              <h2 className="text-xl font-bold text-white">
                안전하고 익명으로 관리됩니다
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              여기 올라오는 모든 글들은 익명으로 관리되며, 개인정보는 수집하지
              않아요. 걱정하지 마세요! 😊 위치 정보는 단순히 범위 확인용으로만
              사용되며 저장되지 않습니다.
            </p>
          </div>

          {/* 네 번째 섹션 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">💡</span>
              <h2 className="text-xl font-bold text-white">
                어떻게 사용하나요?
              </h2>
            </div>
            <div className="text-gray-300 space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-purple-400 font-bold">1.</span>
                <p>특정 장소에 가서 위치 인증을 해주세요</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-purple-400 font-bold">2.</span>
                <p>익명으로 글을 남기거나 사진을 공유하세요</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-purple-400 font-bold">3.</span>
                <p>다른 사람들의 글에 좋아요를 눌러보세요</p>
              </div>
            </div>
          </div>

          {/* 마지막 섹션 */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 text-center">
            <div className="mb-4">
              <span className="text-4xl">💜</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              재미있게 사용해주세요!
            </h2>
            <p className="text-gray-300">
              여러분의 소중한 이야기와 추억을 이 공간에 남겨주세요. 함께
              만들어가는 특별한 공간이 되길 바랍니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            <span className="mr-2">←</span>
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
