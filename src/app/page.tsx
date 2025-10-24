"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, Circle, LoadScript } from "@react-google-maps/api";

// 테스트용 QR존 설정 (현재 위치 주변)
const JEONPO_QR_ZONE = {
  latitude: 35.183205095188974, // 사용자 현재 위치
  longitude: 129.10708116341317,
  radius: 50, // 50m 반경 (테스트용)
  name: "테스트 존",
};

// Google Maps 설정
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapCenter = {
  lat: JEONPO_QR_ZONE.latitude,
  lng: JEONPO_QR_ZONE.longitude,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  // 지도 상호작용은 허용 (드래그, 줌 가능)
  // 기본 스타일 사용 (커스텀 스타일 제거)
};

// 위치 상태 타입 정의
type LocationState = "not_requested" | "in_range" | "out_of_range";

export default function Home() {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(
    null
  );
  const [locationState, setLocationState] =
    useState<LocationState>("not_requested");
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [postText, setPostText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<
    Array<{
      id: string;
      text: string;
      image: string | null;
      location: { latitude: number; longitude: number } | null;
      timestamp: string;
      author: string;
      likeCount?: number;
    }>
  >([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // 분석 이벤트 추적 함수
  const trackEvent = async (event: string) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
    } catch (error) {
      console.error("Analytics error:", error);
    }
  };

  // 컴포넌트 마운트 시 글 목록 불러오기
  useEffect(() => {
    fetchPosts();
    trackEvent("page_view"); // 페이지 방문 추적
  }, []);

  // 컴포넌트 언마운트 시 위치 감지 정리
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // 좋아요 토글 함수
  const toggleLike = async (postId: string) => {
    try {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setLikedPosts((prev) => new Set(prev).add(postId));

      // 좋아요 클릭 이벤트 추적
      trackEvent("like_clicked");

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();

        // 글 목록 업데이트 및 다시 정렬
        setPosts((prevPosts) => {
          const updatedPosts = prevPosts.map((post) =>
            post.id === postId ? { ...post, likeCount: result.likeCount } : post
          );
          // 좋아요 수 기준으로 다시 정렬
          return updatedPosts.sort(
            (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
          );
        });
      } else {
        // 실패 시 UI 롤백
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // 실패 시 UI 롤백
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // 글 목록 불러오기
  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const response = await fetch("/api/posts");
      if (response.ok) {
        const postsData = await response.json();
        // 좋아요 수 기준으로 정렬 (높은 순)
        const sortedPosts = postsData.sort(
          (a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0)
        );
        setPosts(sortedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // 상대시간 계산 함수
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - postTime.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return "방금 전";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}개월 전`;
    }
  };

  // 실시간 위치 감지 시작 (범위 벗어남 감지용)
  const startLocationWatching = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation(position);

        // QR존 내부에 있는지 확인
        const isInZone = checkLocationInZone(position);

        // 범위를 벗어나면 인증 상태 초기화
        if (!isInZone) {
          setLocationState("not_requested");
          stopLocationWatching(); // 감지 중지
          console.log("🚫 범위를 벗어났습니다. 다시 인증이 필요합니다.");
        }
      },
      (error) => {
        console.log("위치 감지 오류:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // 5초마다 업데이트
      }
    );

    setWatchId(id);
  };

  // 위치 감지 중지
  const stopLocationWatching = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // 카메라로 사진 촬영 (1:1 정방형)
  const capturePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // 후면 카메라 사용

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // 1:1 정방형으로 크롭
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // 정방형 크기 계산 (작은 쪽 기준)
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;

            // 중앙에서 크롭
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;

            ctx?.drawImage(img, x, y, size, size, 0, 0, size, size);

            // 크롭된 이미지를 base64로 변환
            const croppedImage = canvas.toDataURL("image/jpeg", 0.8);
            setCapturedImage(croppedImage);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  // 글 남기기
  const submitPost = async () => {
    if (!postText.trim() && !capturedImage) {
      return; // 아무것도 입력하지 않았으면 그냥 무시
    }

    try {
      let imageUrl = null;

      // 이미지가 있으면 먼저 업로드
      if (capturedImage) {
        const uploadResponse = await fetch("/api/upload/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData: capturedImage }),
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.imageUrl;
        } else {
          throw new Error("이미지 업로드 실패");
        }
      }

      // 글 데이터 전송
      const postData = {
        text: postText,
        image: imageUrl,
        location: userLocation
          ? {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }
          : null,
      };

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        // 폼 초기화
        setPostText("");
        setCapturedImage(null);

        // 글 목록 새로고침
        fetchPosts();

        // 글 작성 성공 이벤트 추적
        trackEvent("post_created");
      } else {
        throw new Error("글 작성 실패");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
    }
  };

  // 위치 권한 요청 및 현재 위치 가져오기
  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);

      // 위치 권한 요청 이벤트 추적
      trackEvent("location_permission_requested");

      if (!navigator.geolocation) {
        console.error("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);

          // 현재 위치 로그 출력
          console.log("📍 현재 위치 정보:");
          console.log(`위도: ${position.coords.latitude}`);
          console.log(`경도: ${position.coords.longitude}`);
          console.log(`정확도: ${position.coords.accuracy}m`);

          // QR존까지의 거리 계산 및 로그
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            JEONPO_QR_ZONE.latitude,
            JEONPO_QR_ZONE.longitude
          );
          console.log(`🎯 QR존까지 거리: ${Math.round(distance)}m`);
          console.log(
            `📍 QR존 위치: ${JEONPO_QR_ZONE.latitude}, ${JEONPO_QR_ZONE.longitude}`
          );

          // QR존 내부에 있는지 확인
          const isInZone = checkLocationInZone(position);
          console.log(`✅ 범위 내 여부: ${isInZone ? "범위 내" : "범위 밖"}`);

          if (isInZone) {
            setLocationState("in_range");
            // 실시간 위치 감지 시작
            startLocationWatching();
            // 위치 권한 허용 이벤트 추적
            trackEvent("location_permission_granted");
          } else {
            setLocationState("out_of_range");
            // 위치 권한 허용했지만 범위 밖 이벤트 추적
            trackEvent("location_permission_granted");
          }
          setIsLoading(false);
        },
        (error) => {
          console.log("위치 오류:", error);
          setIsLoading(false);
          // 위치 권한 거부 이벤트 추적
          trackEvent("location_permission_denied");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.log("위치 오류:", error);
      setIsLoading(false);
    }
  };

  // QR존 내부 위치 확인
  const checkLocationInZone = (userLocation: GeolocationPosition) => {
    const distance = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      JEONPO_QR_ZONE.latitude,
      JEONPO_QR_ZONE.longitude
    );

    console.log(`QR존까지 거리: ${Math.round(distance)}m`);
    return distance <= JEONPO_QR_ZONE.radius;
  };

  // 두 지점 간의 거리 계산 (미터 단위)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

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

        {/* 문의 버튼 */}
        <button
          onClick={() => (window.location.href = "/about")}
          className="flex items-center space-x-2 px-3 py-[6] bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
        >
          <span className="text-gray-300 text-sm">💬</span>
          <span className="text-gray-300 text-sm font-medium">이거 뭐임?</span>
        </button>
      </div>

      {/* 기존 헤더 */}
      <div className="py-3 text-center" style={{ backgroundColor: "#0a0a0a" }}>
        <h1 className="text-2xl font-bold text-white">
          🤫 이 장소에 글을 남겨주세요
        </h1>
        <p className="text-sm text-gray-300 my-3">
          여긴 익명으로 우리만의 글을 남길 수 있는 공간이에요
        </p>
        <div
          className="inline-flex items-center px-4 py-2 rounded-full border border-purple-500/30"
          style={{ backgroundColor: "rgba(123, 0, 255, 0.1)" }}
        >
          <span className="text-purple-400 text-sm font-semibold">
            📍 테스트 존 #1
          </span>
        </div>
      </div>

      {/* 전포존 표시 */}

      {/* 지도 미리보기 */}
      <div className="h-48 mx-5 rounded-2xl overflow-hidden relative">
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={18}
            options={mapOptions}
            mapTypeId="roadmap"
          >
            {/* 전포존 원 */}
            <Circle
              center={mapCenter}
              radius={JEONPO_QR_ZONE.radius}
              options={{
                strokeColor: "rgba(123, 0, 255, 0.8)",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: "rgba(123, 0, 255, 0.2)",
                fillOpacity: 0.2,
              }}
            />

            {/* 전포존 마커 */}
            <Marker
              position={mapCenter}
              title="테스트 존"
              options={{
                icon: {
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                  fillColor: "rgba(123, 0, 255, 0.9)",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                  scale: 1.2,
                },
                animation: null, // 애니메이션 비활성화
              }}
            />

            {/* 사용자 현재 위치 마커 (인증 후에만 표시) */}
            {userLocation && (
              <Marker
                position={{
                  lat: userLocation.coords.latitude,
                  lng: userLocation.coords.longitude,
                }}
                title="내 위치"
                options={{
                  icon: {
                    path: "M12,2A10,10 0 1,1 12,22A10,10 0 1,1 12,2Z",
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                    scale: 1.0,
                  },
                  animation: null,
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {/* 지도 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
          <p className="text-white text-sm text-center font-semibold">
            범위 내부에서만 글을 보고 남길 수 있어요
          </p>
        </div>
      </div>

      {/* 상태별 UI 렌더링 */}
      {locationState === "not_requested" && (
        <div className="px-4 py-4">
          <button
            onClick={requestLocationPermission}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400/50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {isLoading ? "위치 확인 중..." : "📍 위치 확인하기"}
          </button>
        </div>
      )}

      {locationState === "in_range" && (
        <div className="px-2 py-4">
          <div className="w-full text-green-400 font-semibold py-1 px-6 rounded-xl text-center">
            위치 인증 완료 ✅
          </div>

          {/* 글/사진 업로드 공간 */}
          <div className="mt-4 bg-black/30 rounded-xl p-2 border border-gray-600/30">
            <div className="space-y-3">
              {/* 텍스트 입력과 사진 영역을 가로로 배치 */}
              <div className="flex space-x-3">
                {/* 사진 추가 버튼 또는 미리보기 */}
                <div className="w-18 h-18 flex-shrink-0">
                  {capturedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={capturedImage}
                        alt="촬영된 사진"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <p className="text-xs font-bold">X</p>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={capturePhoto}
                      className="w-full h-full bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="text-2xl">📷</span>
                    </button>
                  )}
                </div>
                {/* 텍스트 입력 */}
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="글을 남겨주세요"
                  className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg p-2 text-white placeholder-gray-400 resize-none"
                  rows={2}
                />
              </div>

              {/* 글 남기기 버튼 */}
              <button
                onClick={submitPost}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                작성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {locationState === "out_of_range" && (
        <div className="px-4">
          <div className="bg-red-500/10 rounded-2xl p-3 border border-red-500/20 text-center">
            <div className="flex items-center mb-2 justify-center">
              <span className="text-red-400 text-lg mr-2">🚫</span>
              <h3 className="text-lg font-semibold text-white">
                범위 밖에 있어요
              </h3>
            </div>
            {userLocation && (
              <div className="p-2 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400">현재 위치에서 범위까지</p>
                <p className="text-sm text-gray-300 font-semibold">
                  {Math.round(
                    calculateDistance(
                      userLocation.coords.latitude,
                      userLocation.coords.longitude,
                      JEONPO_QR_ZONE.latitude,
                      JEONPO_QR_ZONE.longitude
                    )
                  )}
                  m
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 흔적 목록 - 항상 표시 */}
      <div className="px-0 py-4 pb-20">
        {/* 실제 글 목록 */}
        {isLoadingPosts ? (
          <div className="text-center py-8">
            <p className="text-gray-400">글을 불러오는 중...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {/* 인기글 섹션 - 완전히 분리 */}
            {posts.length > 0 && (
              <div className="px-4">
                <h3 className="text-lg font-bold text-orange-400 flex items-center mb-3">
                  🔥 지금 가장 인기있는 글
                </h3>
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)",
                  }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 border bg-orange-500/20 border-orange-500/30">
                      <span className="text-sm font-bold text-orange-400">
                        {posts[0].author.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {posts[0].author}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        {getRelativeTime(posts[0].timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-0">
                    <p className="text-[16px] text-gray-200 leading-6 mb-2">
                      {posts[0].text}
                    </p>
                    {posts[0].image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        width={300}
                        height={300}
                        src={posts[0].image}
                        alt="사용자 사진"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    )}

                    {/* 좋아요 버튼 */}
                    <div className="flex items-center justify-end mt-3">
                      <button
                        onClick={() => toggleLike(posts[0].id)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors duration-150 active:scale-95 ${
                          likedPosts.has(posts[0].id)
                            ? "bg-red-500/20 border border-red-500/30"
                            : "bg-gray-700/50 hover:bg-gray-600/50 border border-transparent"
                        }`}
                      >
                        <span
                          className={`text-sm transition-transform duration-150 ${
                            likedPosts.has(posts[0].id) ? "scale-125" : ""
                          }`}
                        >
                          ❤️
                        </span>
                        <span
                          className={`text-sm transition-colors duration-150 ${
                            likedPosts.has(posts[0].id)
                              ? "text-red-300 font-bold"
                              : "text-gray-300"
                          }`}
                        >
                          {posts[0].likeCount || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 나머지 글들 섹션 - 완전히 분리 */}
            {posts.length > 1 && (
              <div>
                <h3 className="mx-4 text-lg font-bold text-gray-200 flex items-center mt-6">
                  📝 이 장소에 남기고 간 글들
                </h3>
                <div className="space-y-2">
                  {posts.slice(1).map((post) => (
                    <div
                      key={post.id}
                      className="px-1 py-3 border-b"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div className="flex items-center mb-3 px-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 border bg-purple-500/20 border-purple-500/30">
                          <span className="text-sm font-bold text-purple-400">
                            {post.author.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">
                            {post.author}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {getRelativeTime(post.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* 글 내용과 이미지는 블러 처리 */}
                      <div
                        className={`mb-3 px-3 py-1 ${
                          locationState !== "in_range" ? "blur-sm" : ""
                        }`}
                      >
                        <p className="text-[16px] text-gray-200 leading-6 mb-2">
                          {post.text}
                        </p>
                        {post.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            width={300}
                            height={300}
                            src={post.image}
                            alt="사용자 사진"
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        )}

                        {/* 좋아요 버튼 */}
                        <div className="flex items-center justify-end mt-3">
                          <button
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors duration-150 active:scale-95 ${
                              likedPosts.has(post.id)
                                ? "bg-red-500/20 border border-red-500/30"
                                : "bg-gray-700/50 hover:bg-gray-600/50 border border-transparent"
                            }`}
                          >
                            <span
                              className={`text-sm transition-transform duration-150 ${
                                likedPosts.has(post.id) ? "scale-125" : ""
                              }`}
                            >
                              ❤️
                            </span>
                            <span
                              className={`text-sm transition-colors duration-150 ${
                                likedPosts.has(post.id)
                                  ? "text-red-300 font-bold"
                                  : "text-gray-300"
                              }`}
                            >
                              {post.likeCount || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">아직 남겨진 글이 없어요.</p>
            <p className="text-gray-500 text-sm mt-1">
              첫 번째 글을 남겨보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
