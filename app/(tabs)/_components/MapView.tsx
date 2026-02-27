"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import SearchOverlay from "../../../components/SearchOverlay";
import { useUserLocation } from "./hooks/useUserLocation";
import { useFetchPlaces } from "./hooks/useFetchPlaces";
import {
  getPinIconPath,
  getDiscoverPinIconPath,
  type PinState,
} from "../../../utils/category";
import {
  isWanted,
  isVisited,
  getDiscovered,
} from "../../../utils/bookmarkStorage";
import type { Place } from "./types";
import NearestPlaceCard from "./NearestPlaceCard";
import ActionButtons from "./ActionButtons";
import PlacePopupCard from "./PlacePopupCard";
import VisitedPopup from "./VisitedPopup";
import DiscoverPopup from "./DiscoverPopup";
import BottomNavBar from "./BottomNavBar";

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // カスタムフック
  const { userLocation, locationError } = useUserLocation();
  const { places, isLoading, fetchError } = useFetchPlaces(userLocation);

  // エラー統合
  const error = locationError || fetchError;

  // UI状態
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [showVisitedPopup, setShowVisitedPopup] = useState(false);
  const [visitedTarget, setVisitedTarget] = useState<Place | null>(null);
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<{
    type: "LineString";
    coordinates: [number, number][];
  } | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [currentTargetPlaceId, setCurrentTargetPlaceId] = useState<
    string | null
  >(null);
  const watchIdRef = useRef<number | null>(null);

  // 最寄りのお店（距離ソート済みの先頭）
  const nearest = selectedPlace ?? places[0] ?? null;
  // マーカー再描画トリガー（行きたい/行った/発見保存後にインクリメント）
  const [markerVersion, setMarkerVersion] = useState(0);

  // 中央ボタンクリックで検索オーバーレイを表示
  const handleCenterButtonClick = () => {
    setShowSearch(true);
  };

  // 目的地選択後の処理（メイン目的地）
  const handleSelectDestination = async (target: string) => {
    setShowSearch(false);

    if (!userLocation) return;
    try {
      const res = await fetch("/api/records/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: userLocation.lat,
          startLng: userLocation.lng,
          destName: target,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        console.error(
          "走行記録の開始に失敗しました:",
          data.detail || data.message,
        );
        return;
      }

      setCurrentRecordId(data.recordId ?? null);
      setCurrentTargetPlaceId(data.targetPlaceId ?? null);
      // 新しいルート開始時は既存のルート表示をクリア
      setRouteGeometry(null);
    } catch (e) {
      console.error("走行記録の開始中にエラーが発生しました:", e);
    }
  };

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
              "background-color": "#4ade80",
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

    // 場所の状態からピンステートを判定
    const getPlacePinState = (place: Place): PinState => {
      if (isVisited(place.name)) return 3;
      if (isWanted(place.name)) return 2;
      return 1;
    };

    const addMarkers = () => {
      const markers: maplibregl.Marker[] = [];

      places.forEach((place) => {
        const pinState = getPlacePinState(place);
        const iconPath = getPinIconPath(place.category || "", pinState);

        // カテゴリ別アイコンマーカー
        const el = document.createElement("div");
        el.style.width = "100px";
        el.style.height = "100px";
        el.style.backgroundImage = `url("${iconPath}")`;
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "center";
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
  }, [places, markerVersion]);

  // 発見スポットのマーカーを描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addDiscoverMarkers = () => {
      const markers: maplibregl.Marker[] = [];
      const discovered = getDiscovered();

      discovered.forEach((record) => {
        if (record.lat == null || record.lng == null) return;

        const iconPath = getDiscoverPinIconPath(record.category);

        const el = document.createElement("div");
        el.style.width = "60px";
        el.style.height = "60px";
        el.style.backgroundImage = `url("${iconPath}")`;
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "center";
        el.style.cursor = "pointer";
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.25))";

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([record.lng, record.lat])
          .addTo(map);

        markers.push(marker);
      });

      return markers;
    };

    let markers: maplibregl.Marker[] = [];

    if (map.loaded()) {
      markers = addDiscoverMarkers();
    } else {
      map.on("load", () => {
        markers = addDiscoverMarkers();
      });
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [markerVersion]);

  // マップの表示切替
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("osm-layer")) {
      // isPeeking=trueなら地図を出す、falseなら背景だけ表示して地図はフェードアウト
      map.setPaintProperty("osm-layer", "raster-opacity-transition", {
        duration: 300,
      });
      map.setPaintProperty("osm-layer", "raster-opacity", isPeeking ? 1 : 0);
    }

    if (map.getLayer("route-line")) {
      map.setPaintProperty("route-line", "line-opacity-transition", {
        duration: 300,
      });
      map.setPaintProperty("route-line", "line-opacity", isPeeking ? 1 : 0);
    }
  }, [isPeeking]);

  // 位置情報を継続的に取得して path_points に送信
  useEffect(() => {
    if (!currentRecordId) {
      // 記録対象がなくなったらウォッチを解除
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation || watchIdRef.current != null) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          recordedAt: new Date().toISOString(),
        };

        try {
          await fetch("/api/path-points", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordId: currentRecordId,
              points: [point],
            }),
          });
        } catch (e) {
          console.error("経路ポイント送信中にエラーが発生しました:", e);
        }
      },
      (err) => {
        console.error("位置情報ウォッチ中にエラーが発生しました:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [currentRecordId]);

  // 経路取得（初回の地図表示時に実行）
  useEffect(() => {
    if (!isPeeking || !userLocation || !nearest || routeGeometry || isRouteLoading)
      return;

    const fetchRoute = async () => {
      setIsRouteLoading(true);
      setRouteError(null);
      try {
        const res = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startLat: userLocation.lat,
            startLng: userLocation.lng,
            destLat: nearest.lat,
            destLng: nearest.lng,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.status !== "success" || !data.route?.geometry) {
          throw new Error(
            data.detail || data.message || "経路の取得に失敗しました",
          );
        }

        setRouteGeometry(data.route.geometry);
      } catch (e: any) {
        console.error("経路取得エラー:", e);
        setRouteError(
          e?.message ?? "経路の取得中にエラーが発生しました",
        );
      } finally {
        setIsRouteLoading(false);
      }
    };

    fetchRoute();
  }, [isPeeking, userLocation, nearest, routeGeometry, isRouteLoading]);

  // 経路ラインをマップに描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeGeometry) return;

    const sourceId = "route";
    const layerId = "route-line";

    const feature = {
      type: "Feature",
      geometry: routeGeometry,
      properties: {},
    };

    const existingSource = map.getSource(sourceId) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(feature as any);
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: feature as any,
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 5,
          "line-opacity": isPeeking ? 1 : 0,
        },
      });
    }
  }, [routeGeometry, isPeeking]);

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

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* ===== 地図（全画面） ===== */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(to right, white 2px, transparent 2px),
                         linear-gradient(to bottom, white 2px, transparent 2px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center 60%, black 0%, transparent 80%)",
        }}
      ></div>

      {/* ===== 上部オーバーレイ ===== */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-start justify-between pt-12 pointer-events-none">
        <NearestPlaceCard isLoading={isLoading} nearest={nearest} />

        <ActionButtons
          isPeeking={isPeeking}
          onPeekStart={() => setIsPeeking(true)}
          onPeekEnd={() => setIsPeeking(false)}
          onDiscover={() => {
            setShowDiscoverPopup(true);
          }}
        />
      </div>

      {/* APIエラーバナー（マップ表示中） */}
      {(error || routeError) && userLocation && (
        <div className="absolute top-36 left-1/2 z-10 w-72 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-2 shadow-md">
          <p className="text-center text-xs text-red-500">
            {routeError || error}
          </p>
        </div>
      )}

      {/* ===== 選択スポット ポップアップカード ===== */}
      {selectedPlace && (
        <PlacePopupCard
          selectedPlace={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onVisited={(place) => {
            setSelectedPlace(null);
            setVisitedTarget(place);
            setShowVisitedPopup(true);
          }}
          onBookmarkChange={() => setMarkerVersion((v) => v + 1)}
        />
      )}

      {/* ===== 行った記録ポップアップ（評価・メモ・写真） ===== */}
      {visitedTarget && (
        <VisitedPopup
          show={showVisitedPopup}
          nearest={visitedTarget}
          onSaveVisit={async () => {
            if (!currentRecordId) return;
            try {
              const res = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recordId: currentRecordId,
                  targetPlaceId: currentTargetPlaceId ?? undefined,
                }),
              });

              const data = await res.json();

              if (!res.ok || data.status !== "success") {
                console.error(
                  "訪問記録の保存に失敗しました:",
                  data.detail || data.message,
                );
              }
            } catch (e) {
              console.error("訪問記録の保存中にエラーが発生しました:", e);
            }
          }}
          onClose={() => {
            setShowVisitedPopup(false);
            setVisitedTarget(null);
            setMarkerVersion((v) => v + 1);
          }}
        />
      )}

      {/* ===== 発見ポップアップ（自由スポット登録） ===== */}
      <DiscoverPopup
        show={showDiscoverPopup}
        onClose={() => setShowDiscoverPopup(false)}
        userLocation={userLocation}
        onSaved={() => setMarkerVersion((v) => v + 1)}
      />

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectDestination={handleSelectDestination}
      />

      {/* ===== 下部ナビゲーションバー ===== */}
      <BottomNavBar
        onCenterClick={handleCenterButtonClick}
        isLoading={isLoading}
      />
    </div>
  );
}
