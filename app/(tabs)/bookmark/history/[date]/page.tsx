"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getRoutesByDate,
  type RouteRecord,
  type RoutePlace,
} from "../../../../../utils/mockRouteHistory";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ステータスラベル定義
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  visited: { label: "行った", bg: "bg-green-500", text: "text-white" },
  wanted: { label: "行きたい", bg: "bg-amber-400", text: "text-white" },
  discovered: { label: "発見", bg: "bg-sky-400", text: "text-white" },
};

export default function RouteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const date = params.date as string;

  const routes = useMemo(() => getRoutesByDate(date), [date]);

  // 選択中の経路 index（複数経路がある場合）
  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentRoute = routes[selectedIdx] ?? null;

  // 日付表示用フォーマット "2026.2.25 / 14:30~"
  const displayDate = useMemo(() => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    const time = currentRoute?.startTime ?? "";
    return `${y}.${Number(m)}.${Number(d)}${time ? ` / ${time}~` : ""}`;
  }, [date, currentRoute]);

  // 全経路の場所を統合
  const allPlaces = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.places;
  }, [currentRoute]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ===== ヘッダー ===== */}
      <div className="sticky top-0 z-20 bg-sky-300">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-white p-1 -ml-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">経路履歴</h1>
          </div>
        </div>
      </div>

      {/* ===== コンテンツ ===== */}
      {routes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            この日の経路データはありません
          </p>
        </div>
      ) : (
        <>
          {/* 複数経路がある場合のタブ */}
          {routes.length > 1 && (
            <div className="flex gap-2 px-4 pt-4">
              {routes.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                    selectedIdx === i
                      ? "bg-sky-400 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  経路 {i + 1}
                </button>
              ))}
            </div>
          )}

          {currentRoute && (
            <>
              {/* 日付・時刻 */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-bold text-gray-600">{displayDate}</p>
              </div>

              {/* 地図 */}
              <RouteMap route={currentRoute} />

              {/* 距離・時間バー */}
              <StatsBar route={currentRoute} />

              {/* 場所リスト */}
              {allPlaces.length > 0 && (
                <div className="px-4 pt-2 pb-4 space-y-0">
                  {allPlaces.map((place, i) => (
                    <div key={place.id}>
                      <PlaceCard place={place} />
                      {i < allPlaces.length - 1 && (
                        <div className="border-b border-gray-100 mx-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ========================================
// 距離・時間バー
// ========================================
function StatsBar({ route }: { route: RouteRecord }) {
  return (
    <div className="flex items-center gap-0 mx-4 bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 距離 */}
      <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span className="text-base font-bold text-gray-700">
          {route.distanceKm}km
        </span>
      </div>
      {/* 時間 */}
      <div className="flex-1 flex items-center justify-center gap-2 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-base font-bold text-gray-700">
          {route.durationMin}min
        </span>
      </div>
    </div>
  );
}

// ========================================
// 場所カード（画像のUIに合わせたリスト）
// ========================================
function PlaceCard({ place }: { place: RoutePlace }) {
  const statusConf = STATUS_CONFIG[place.status] ?? STATUS_CONFIG.visited;

  return (
    <div className="bg-white px-4 py-4">
      {/* 名前 */}
      <h4 className="text-base font-bold text-gray-800 mb-1">{place.name}</h4>

      {/* 星評価 */}
      {place.rating && (
        <div className="flex text-sm mb-1.5">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={
                i < (place.rating ?? 0) ? "text-yellow-400" : "text-gray-300"
              }
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* カテゴリ・営業時間・距離 */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">
          {place.category}
        </span>
        {place.hours && <span>{place.hours}</span>}
        {place.distance && <span>{place.distance}</span>}
      </div>

      {/* コメント + 画像 */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          {place.comment && (
            <div className="flex items-start gap-1 text-xs text-gray-600">
              <span className="text-gray-400 mt-0.5 shrink-0">✎</span>
              <p className="line-clamp-2 leading-relaxed">{place.comment}</p>
            </div>
          )}

          {/* ステータスバッジ */}
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusConf.bg} ${statusConf.text}`}
            >
              {statusConf.label}
            </span>
          </div>
        </div>

        {/* 画像プレースホルダー */}
        <div className="w-24 h-18 shrink-0 bg-gray-200 rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
            {place.imageUrl ? (
              <span className="text-xs">Image</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 経路マップ
// ========================================
function RouteMap({ route }: { route: RouteRecord }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || route.pathPoints.length === 0) return;

    // 既存マップを破棄
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [route.startLng, route.startLat],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 経路ライン
      const coordinates = route.pathPoints.map((p) => [p.lng, p.lat]);

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });

      // スタートマーカー（S ラベル付き）
      const startEl = document.createElement("div");
      startEl.style.cssText =
        "width:28px;height:28px;border-radius:4px;background:#3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);";
      startEl.innerText = "S";
      new maplibregl.Marker({ element: startEl })
        .setLngLat([route.startLng, route.startLat])
        .addTo(map);

      // ゴールマーカー（赤ピン）
      const endEl = document.createElement("div");
      endEl.innerHTML = `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`;
      endEl.style.cssText = "cursor:pointer;";
      new maplibregl.Marker({ element: endEl, anchor: "bottom" })
        .setLngLat([route.endLng, route.endLat])
        .addTo(map);

      // 全経路が表示されるようにバウンドを調整
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [route]);

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-sm">
      <div ref={mapContainer} className="w-full" style={{ height: "240px" }} />
    </div>
  );
}
