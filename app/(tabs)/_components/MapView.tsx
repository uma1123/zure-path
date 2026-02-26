"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchOverlay from "../../../components/SearchOverlay";
import { getSelectedOsmTags } from "../../../utils/categoryStorage";
import { getCategoryDisplay } from "../../../utils/category";

type Place = {
  name: string;
  lat: number;
  lng: number;
  distance: number;
  bearing: number;
  category?: string;
};

type ExploreResponse = {
  status: "success" | "error";
  searchedRadius: number;
  places: Place[];
  message?: string;
  detail?: string;
};

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null);
  const [isPeeking, setIsPeeking] = useState(false);
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [discoverRating, setDiscoverRating] = useState(0);
  const [discoverMemo, setDiscoverMemo] = useState("");

  // 中央ボタンクリックで検索オーバーレイを表示
  const handleCenterButtonClick = () => {
    setShowSearch(true);
  };

  // 目的地選択後の処理
  const handleSelectDestination = (target: string) => {
    setShowSearch(false);
    console.log("選択された目的地:", target);
  };

  // 現在地を取得
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("位置情報の使用が許可されていません");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("位置情報を取得できませんでした");
            break;
          case err.TIMEOUT:
            setError("位置情報の取得がタイムアウトしました");
            break;
          default:
            setError("位置情報の取得に失敗しました");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  // 2点間の距離を簡易計算（キャッシュ判定用）
  const getDistanceMeters = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ) => {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  // 周辺のお店を取得（50m以内ならキャッシュを利用）
  const fetchPlaces = useCallback(async () => {
    if (!userLocation) return;

    // 前回のフェッチ位置から50m以内なら再リクエストしない
    if (lastFetchLocation.current) {
      const dist = getDistanceMeters(lastFetchLocation.current, userLocation);
      if (dist < 50) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLat: userLocation.lat,
          currentLng: userLocation.lng,
          radius: 3000,
          osmTags: getSelectedOsmTags(),
        }),
      });

      const data: ExploreResponse = await res.json();

      if (data.status === "error") {
        setError(data.detail || "お店の取得に失敗しました");
        return;
      }

      setPlaces(data.places);
      lastFetchLocation.current = {
        lat: userLocation.lat,
        lng: userLocation.lng,
      };
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // 現在地が取得できたらAPIを呼ぶ
  useEffect(() => {
    if (userLocation) {
      fetchPlaces();
    }
  }, [userLocation, fetchPlaces]);

  // 地図を初期化
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          // 通常表示は背景レイヤーのみで、お店のピンのみ表示
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#f0fdf4",
            },
          },

          // 救済で地図を表示する
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            paint: {
              "raster-opacity": 0, // 初期値は0（見えない）
              "raster-saturation": -0.5, // 彩度を下げる
            },
          },
        ],
      },
      center: [userLocation.lng, userLocation.lat],
      zoom: 17,
      pitch: 80,
      attributionControl: false,
    });

    // 現在地を画面中央より下に表示するため、上部にパディングを設定
    map.setPadding({
      top: 200,
      bottom: 0,
      left: 0,
      right: 0,
    });

    // タイル読み込みエラーをログ
    map.on("error", (e) => {
      console.error("MapLibre error:", e.error?.message || e);
    });

    // マップクリックでポップアップカードを閉じる
    map.on("click", () => {
      setSelectedPlace(null);
    });

    // 現在地マーカー（青い丸）
    const userEl = document.createElement("div");
    userEl.style.width = "18px";
    userEl.style.height = "18px";
    userEl.style.borderRadius = "50%";
    userEl.style.backgroundColor = "#3B82F6";
    userEl.style.border = "3px solid white";
    userEl.style.boxShadow = "0 0 8px rgba(59,130,246,0.7)";

    new maplibregl.Marker({ element: userEl })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userLocation]);

  // お店のマーカーを更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const addMarkers = () => {
      const markers: maplibregl.Marker[] = [];

      places.forEach((place) => {
        // ティアドロップ型ピンマーカー
        const el = document.createElement("div");
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><ellipse cx="16" cy="14" rx="12" ry="12" fill="white" stroke="#d1d5db" stroke-width="1.5"/><path d="M16 40 C16 40 4 22 4 14 A12 12 0 0 1 28 14 C28 22 16 40 16 40Z" fill="white" stroke="#d1d5db" stroke-width="1.5"/><ellipse cx="16" cy="14" rx="8" ry="8" fill="#9CA3AF"/></svg>`,
        )}")`;
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.cursor = "pointer";
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.25))";

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([place.lng, place.lat])
          .addTo(map);

        // タップで上部カード更新（React stateで管理するポップアップカードを表示）
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedPlace(place);
        });

        markers.push(marker);
      });

      return markers;
    };

    let markers: maplibregl.Marker[] = [];

    if (map.loaded()) {
      markers = addMarkers();
    } else {
      map.on("load", () => {
        markers = addMarkers();
      });
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [places]);

  // マップの表示切替
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("osm-layer")) return;

    // isPeeking=trueなら地図を出す、falseなら背景だけ表示して地図はフェードアウト
    map.setPaintProperty("osm-layer", "raster-opacity-transition", {
      duration: 300,
    });
    map.setPaintProperty("osm-layer", "raster-opacity", isPeeking ? 1 : 0);
  }, [isPeeking]);

  // 現在地取得中
  if (!userLocation && !error) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">現在地を取得中...</p>
        </div>
      </div>
    );
  }

  // 位置情報エラー（マップ表示不可）
  if (error && !userLocation) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="mb-1 text-3xl">📍</p>
          <p className="mb-1 text-base font-bold text-gray-800">
            位置情報が必要です
          </p>
          <p className="mb-4 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-green-500 py-3 text-sm font-bold text-white active:bg-green-600"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // 最寄りのお店（距離ソート済みの先頭）
  const nearest = selectedPlace ?? places[0] ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* ===== 地図（全画面） ===== */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #4ade80 1px, transparent 1px),
                         linear-gradient(to bottom, #4ade80 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center 60%, black 0%, transparent 80%)",
        }}
      ></div>

      {/* ===== 上部オーバーレイ ===== */}
      {/* コンテナ自体はタッチイベントを阻害しないようにpointer-events-noneにする */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-start justify-between pt-12 pointer-events-none">
        {/* 最寄り場所カード（ピル型デザイン） */}
        {/* ここだけpointer-events-autoにしてクリック可能にする */}
        <div className="pointer-events-auto mb-4 flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-md backdrop-blur-md transition-all hover:bg-white active:scale-95">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
              <span className="text-sm font-medium text-gray-600">
                探索中...
              </span>
            </div>
          ) : nearest ? (
            <div className="flex items-center gap-3">
              {/* 距離の強調表示 */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-500 font-bold">あと</span>
                <span className="text-xl font-extrabold text-green-600 tracking-tight">
                  {nearest.distance}
                </span>
                <span className="text-xs text-gray-500 font-bold">m</span>
              </div>

              {/* 区切り線 */}
              <div className="h-4 w-px bg-gray-300" />

              {/* 店舗名 */}
              <div className="flex items-center gap-1 max-w-[140px]">
                <span className="truncate text-sm font-bold text-gray-800">
                  {nearest.name}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              近くにお店がありません
            </span>
          )}
        </div>

        {/* 右側アクションボタン群（レイアウトを調整して右上に配置し直す） */}
        {/* absoluteで右上に固定し直すことで、中央のカードと干渉させない */}
        <div className="absolute top-12 right-4 flex flex-col gap-3 pointer-events-auto">
          {/* 地図表示切替 */}
          <button
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 ${
              isPeeking
                ? "bg-green-500 scale-110 ring-4 ring-green-200"
                : "bg-white/90 active:bg-gray-100"
            }`}
            onPointerDown={() => setIsPeeking(true)}
            onPointerUp={() => setIsPeeking(false)}
            onPointerLeave={() => setIsPeeking(false)}
          >
            <Image
              src="/images/change_map.svg"
              width={20}
              height={20}
              alt="Map View"
            />
          </button>
          {/* 発見 */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-md active:bg-yellow-500 border-2 border-white"
            onClick={() => {
              if (nearest) {
                setDiscoverRating(0);
                setDiscoverMemo("");
                setShowDiscoverPopup(true);
              }
            }}
          >
            <Image
              src="/images/discover.svg"
              width={20}
              height={20}
              alt="Discover"
              style={{ width: "auto", height: "auto" }}
            />
          </button>
        </div>
      </div>

      {/* APIエラーバナー（マップ表示中） */}
      {error && userLocation && (
        <div className="absolute top-36 left-1/2 z-10 w-72 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-2 shadow-md">
          <p className="text-center text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* ===== 選択スポット ポップアップカード ===== */}
      {selectedPlace &&
        (() => {
          const display = getCategoryDisplay(selectedPlace.category || "");
          return (
            <div
              className="absolute bottom-28 left-4 right-4 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl bg-white shadow-xl p-4">
                {/* 閉じるボタン */}
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200 z-10"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M1 1L11 11M11 1L1 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* カード上部: 情報 + 画像 */}
                <div className="flex gap-3">
                  {/* 左: テキスト情報 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate pr-6">
                      {selectedPlace.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {display.label}
                    </p>
                  </div>

                  {/* 右: カテゴリ画像 */}
                  <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={display.image}
                      alt={display.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* カード下部: アクションボタン */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => {
                      console.log("行った:", selectedPlace.name);
                    }}
                    className="flex-1 rounded-full bg-green-500 py-2.5 text-sm font-bold text-white active:bg-green-600 transition-colors"
                  >
                    行った
                  </button>
                  <button
                    onClick={() => {
                      console.log("行きたい:", selectedPlace.name);
                    }}
                    className="flex-1 rounded-full border-2 border-green-500 py-2.5 text-sm font-bold text-green-600 active:bg-green-50 transition-colors"
                  >
                    行きたい
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ===== 発見ポップアップ ===== */}
      {showDiscoverPopup &&
        nearest &&
        (() => {
          const display = getCategoryDisplay(nearest.category || "");
          return (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
              onClick={() => setShowDiscoverPopup(false)}
            >
              <div
                className="w-full max-w-md rounded-t-3xl bg-white pb-8 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 閉じるボタン */}
                <button
                  onClick={() => setShowDiscoverPopup(false)}
                  className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 active:bg-gray-300"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M1 1L11 11M11 1L1 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* === 上部: 撮影・評価・メモ === */}
                <div className="px-5 pt-5">
                  {/* 撮影エリア */}
                  {/* ここは仮のUI。実装段階でカメラ起動や写真選択のUIに置き換える予定。 */}
                  <div className="flex items-center justify-center rounded-2xl bg-gray-100 h-40 mb-4">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-sm font-medium">撮影する</span>
                    </div>
                  </div>

                  {/* 星評価 */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setDiscoverRating(star)}
                        className="p-0.5"
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill={star <= discoverRating ? "#FBBF24" : "none"}
                          stroke={
                            star <= discoverRating ? "#FBBF24" : "#D1D5DB"
                          }
                          strokeWidth="1.5"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* ひとことメモ */}
                  <div className="flex items-start gap-2 mb-4">
                    <svg
                      className="mt-2.5 shrink-0 text-gray-400"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="ひとことメモ"
                      value={discoverMemo}
                      onChange={(e) => setDiscoverMemo(e.target.value)}
                      className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors"
                    />
                  </div>
                </div>

                {/* 区切り線 */}
                <div className="h-px bg-gray-100 mx-5 mb-4" />

                {/* === 下部: スポット情報（既存ポップアップと同じ） === */}
                <div className="px-5">
                  <div className="flex gap-3 mb-4">
                    {/* 左: テキスト情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {nearest.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {display.label}
                      </p>
                    </div>
                    {/* 右: カテゴリ画像 */}
                    <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={display.image}
                        alt={display.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* 行ったボタン */}
                  <button
                    onClick={() => {
                      console.log(
                        "発見:",
                        nearest.name,
                        "評価:",
                        discoverRating,
                        "メモ:",
                        discoverMemo,
                      );
                      setShowDiscoverPopup(false);
                    }}
                    className="w-full rounded-full bg-green-500 py-3 text-sm font-bold text-white active:bg-green-600 transition-colors"
                  >
                    行った
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectDestination={handleSelectDestination}
      />

      {/* ===== 下部ナビゲーションバー ===== */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)]">
        {/* SVGを使った背景コンテナ */}
        <div className="relative w-full h-[90px]">
          <svg
            className="absolute bottom-0 w-full h-auto filter drop-shadow-[0_-6px_24px_rgba(0,0,0,0.10)]"
            viewBox="0 0 375 90" // 基準となるビューボックス
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none" // 横幅に合わせて伸縮させる
          >
            {/* 湾曲した背景 */}
            <path
              d="M0 90V35C0 35 80 10 187.5 10C295 10 375 35 375 35V90H0Z"
              fill="white"
            />
          </svg>

          {/* ボタン配置用コンテナ */}
          <div className="absolute inset-0 pointer-events-none">
            {" "}
            {/* pointer-events-noneで背後のSVGへのクリックを妨げない */}
            {/* 左ボタン: ブックマーク */}
            <button
              className="absolute flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 pointer-events-auto" // ボタンはクリック可能にする
              style={{
                left: "18%",
                bottom: "10px",
                width: "50px",
                height: "50px",
              }}
              onClick={() => {
                router.push("/bookmark");
              }}
            >
              <Image
                src="/images/saved.svg"
                width={40}
                height={40}
                alt="Bookmark"
              />
            </button>
            {/* 中央ボタン:目的地検索*/}
            <button
              onClick={handleCenterButtonClick}
              disabled={isLoading}
              className="absolute flex items-center justify-center rounded-full bg-green-500 shadow-xl transition-transform active:scale-95 disabled:opacity-60 pointer-events-auto"
              style={{
                left: "50%",
                top: "0",
                transform: "translate(-50%, -10%)", // 上に飛び出させる位置を調整
                width: "64px",
                height: "64px",
              }}
            >
              {isLoading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white border-t-transparent" />
              ) : (
                <Image
                  src="/images/destination.svg"
                  width={48}
                  height={48}
                  alt="Location"
                  priority
                />
              )}
            </button>
            {/* 右ボタン: 設定 */}
            <button
              className="absolute flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 pointer-events-auto"
              style={{
                right: "18%",
                bottom: "10px",
                width: "50px",
                height: "50px",
              }}
              onClick={() => router.push("/settings")}
            >
              <Image
                src="/images/setting.svg"
                width={40}
                height={40}
                alt="Settings"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
