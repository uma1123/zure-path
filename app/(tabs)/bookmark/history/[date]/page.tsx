"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getRoutesByDate,
  type RouteRecord,
  type RoutePlace,
} from "../../../../../utils/mockRouteHistory";
import {
  getVisited,
  getWanted,
  getDiscovered,
  type PlaceRecord,
} from "../../../../../utils/bookmarkStorage";
import { getCategoryImageByName } from "../../../../../utils/category";
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

  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [dayBookmarks, setDayBookmarks] = useState<{
    visited: PlaceRecord[];
    wanted: PlaceRecord[];
    discovered: PlaceRecord[];
  }>({ visited: [], wanted: [], discovered: [] });

  // 経路を API から取得（失敗時は getRoutesByDate）
  useEffect(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/route-history?date=${encodeURIComponent(date)}`);
        const data = await res.json();
        if (!cancelled && res.ok && data.status === "success" && Array.isArray(data.routes)) {
          setRoutes(data.routes as RouteRecord[]);
          return;
        }
      } catch {
        // ignore
      }
      if (!cancelled) {
        setRoutes(getRoutesByDate(date));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  // その日の行った・行きたい・発見を取得
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    (async () => {
      try {
        const [visited, wanted, discovered] = await Promise.all([
          getVisited(),
          getWanted(),
          getDiscovered(),
        ]);
        if (cancelled) return;
        setDayBookmarks({
          visited: visited.filter((r) => r.rawDate === date),
          wanted: wanted.filter((r) => r.rawDate === date),
          discovered: discovered.filter((r) => r.rawDate === date),
        });
      } catch {
        if (!cancelled) setDayBookmarks({ visited: [], wanted: [], discovered: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  // 選択中の経路 index（複数経路がある場合）
  const [selectedIdx, setSelectedIdx] = useState(0);
  useEffect(() => {
    if (routes.length > 0 && selectedIdx >= routes.length) {
      setSelectedIdx(0);
    }
  }, [routes.length, selectedIdx]);
  const safeIdx = routes.length > 0 ? Math.min(selectedIdx, routes.length - 1) : 0;
  const currentRoute = routes[safeIdx] ?? null;

  // 日付表示用フォーマット "2026.2.25 / 14:30~"
  const displayDate = useMemo(() => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    const time = currentRoute?.startTime ?? "";
    return `${y}.${Number(m)}.${Number(d)}${time ? ` / ${time}~` : ""}`;
  }, [date, currentRoute]);

  // 全経路の場所を統合（経路に紐づく places）
  const allPlaces = useMemo(() => {
    if (!currentRoute) return [];
    return currentRoute.places;
  }, [currentRoute]);

  // その日の合計距離・時間（複数経路時）
  const dayTotal = useMemo(() => {
    if (routes.length <= 1) return null;
    const totalKm = routes.reduce((acc, r) => acc + r.distanceKm, 0);
    const totalMin = routes.reduce((acc, r) => acc + r.durationMin, 0);
    return { totalKm: Math.round(totalKm * 10) / 10, totalMin };
  }, [routes]);

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
      {/* 経路がない場合のメッセージ（ブックマークがある場合は「経路はない」旨のみ） */}
      {routes.length === 0 &&
        (dayBookmarks.visited.length > 0 ||
          dayBookmarks.wanted.length > 0 ||
          dayBookmarks.discovered.length > 0) && (
          <div className="text-center py-8 px-4">
            <p className="text-gray-400 text-sm">
              この日の経路データはありません
            </p>
          </div>
        )}

      {/* 経路がある場合: タブ・地図・距離・時間・経路に紐づく places */}
      {routes.length > 0 && (
        <>
          {/* 複数経路がある場合のタブ */}
          {routes.length > 1 && (
            <div className="flex gap-2 px-4 pt-4">
              {routes.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                    safeIdx === i
                      ? "bg-sky-400 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  経路 {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* その日の合計（複数経路時） */}
          {dayTotal && (
            <div className="mx-4 mt-3 mb-1 px-4 py-2 bg-sky-50 rounded-xl border border-sky-100">
              <p className="text-xs text-sky-600 font-bold mb-0.5">この日の合計</p>
              <p className="text-base font-bold text-gray-800">
                {dayTotal.totalKm}km / {dayTotal.totalMin}分
              </p>
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

              {/* 経路に紐づく場所リスト */}
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

      {/* この日の行った・行きたい・発見（経路の有無にかかわらず表示） */}
      {(dayBookmarks.visited.length > 0 ||
        dayBookmarks.wanted.length > 0 ||
        dayBookmarks.discovered.length > 0) && (
        <div className="px-4 pt-4 pb-6 border-t border-gray-100 mt-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            この日の行った・行きたい・発見
          </h3>
          <div className="space-y-3">
            {dayBookmarks.visited.map((item) => (
              <BookmarkCard key={`v-${item.id}`} item={item} kind="visited" />
            ))}
            {dayBookmarks.wanted.map((item) => (
              <BookmarkCard key={`w-${item.id}`} item={item} kind="wanted" />
            ))}
            {dayBookmarks.discovered.map((item) => (
              <BookmarkCard key={`d-${item.id}`} item={item} kind="discovered" />
            ))}
          </div>
        </div>
      )}

      {/* 経路もブックマークもない場合 */}
      {routes.length === 0 &&
        dayBookmarks.visited.length === 0 &&
        dayBookmarks.wanted.length === 0 &&
        dayBookmarks.discovered.length === 0 && (
          <div className="text-center py-20 px-4">
            <p className="text-gray-400 text-sm">この日のデータはありません</p>
          </div>
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
// 場所カード（画像・高さを固定して統一）
// ========================================
function PlaceCard({ place }: { place: RoutePlace }) {
  const statusConf = STATUS_CONFIG[place.status] ?? STATUS_CONFIG.visited;
  const [imgError, setImgError] = useState(false);
  const displayImage =
    !imgError && place.imageUrl
      ? place.imageUrl
      : getCategoryImageByName(place.category ?? "");

  return (
    <div className="bg-white px-4 py-4 min-h-[120px] flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-base font-bold text-gray-800 mb-1">
          {place.name}
        </h4>
        {place.rating != null && (
          <div className="flex text-sm mb-1">
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
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-1">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">
            {place.category}
          </span>
          {place.hours && <span>{place.hours}</span>}
          {place.distance && <span>{place.distance}</span>}
        </div>
        {place.comment && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {place.comment}
          </p>
        )}
        <div className="mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusConf.bg} ${statusConf.text}`}
          >
            {statusConf.label}
          </span>
        </div>
      </div>
      <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
        <img
          src={displayImage}
          alt={place.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    </div>
  );
}

// ========================================
// ブックマークカード（この日の行った・行きたい・発見・画像は常に表示・高さ統一）
// ========================================
function BookmarkCard({
  item,
  kind,
}: {
  item: PlaceRecord;
  kind: "visited" | "wanted" | "discovered";
}) {
  const statusConf = STATUS_CONFIG[kind];
  const [imgError, setImgError] = useState(false);
  const displayImage =
    !imgError && item.imageUrl
      ? item.imageUrl
      : getCategoryImageByName(item.category ?? "");

  return (
    <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm min-h-[100px] flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-base font-bold text-gray-800">
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">
            {item.category}
          </span>
          {item.distance && <span>{item.distance}</span>}
        </div>
        {kind === "visited" && item.rating != null && (
          <div className="flex text-sm mt-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < (item.rating ?? 0) ? "text-yellow-400" : "text-gray-300"
                }
              >
                ★
              </span>
            ))}
          </div>
        )}
        {item.comment && (
          <p className="text-xs text-gray-600 mt-1">
            {item.comment}
          </p>
        )}
        <div className="mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusConf.bg} ${statusConf.text}`}
          >
            {statusConf.label}
          </span>
        </div>
      </div>
      <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
        <img
          src={displayImage}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
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
