"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import turfCircle from "@turf/circle";
import turfUnion from "@turf/union";
import {
  polygon as turfPolygon,
  featureCollection as turfFc,
} from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import SearchOverlay, {
  type Destination as SearchDestination,
} from "../../../components/SearchOverlay";
import { useUserLocation } from "./hooks/useUserLocation";
import { useFetchPlaces } from "./hooks/useFetchPlaces";
import { useDeviceHeading } from "./hooks/useDeviceHeading";
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
import ArrivalPopup from "./ArrivalPopup";
import ExploreResultOverlay, { type PathPoint } from "./ExploreResultOverlay";
import BottomNavBar from "./BottomNavBar";
import { addRoute } from "../../../utils/mockRouteHistory";

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // カスタムフック
  const { userLocation, locationError } = useUserLocation();
  const { places, isLoading, fetchError } = useFetchPlaces(userLocation);
  const { heading } = useDeviceHeading();

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
  const mainDestinationMarkerRef = useRef<maplibregl.Marker | null>(null);
  // 常時位置トラッキング & 霧マスク用
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pathWatchIdRef = useRef<number | null>(null);
  const walkedPathRef = useRef<[number, number][]>([]);
  const fogUnionRef = useRef<Feature<Polygon | MultiPolygon> | null>(null);
  const [mainDestination, setMainDestination] =
    useState<SearchDestination | null>(null);
  // 到着ポップアップ・結果画面用
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const [showExploreResult, setShowExploreResult] = useState(false);
  const collectedPathPointsRef = useRef<PathPoint[]>([]);
  const exploreStartTimeRef = useRef<Date | null>(null);
  const [resultPathPoints, setResultPathPoints] = useState<PathPoint[]>([]);
  const [resultStartLocation, setResultStartLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [resultDestination, setResultDestination] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [resultDistanceKm, setResultDistanceKm] = useState(0);
  const [resultDurationMin, setResultDurationMin] = useState(0);

  // 最寄りのお店（距離ソート済みの先頭）
  const nearest = selectedPlace ?? places[0] ?? null;
  // マーカー再描画トリガー（行きたい/行った/発見保存後にインクリメント）
  const [markerVersion, setMarkerVersion] = useState(0);

  // 中央ボタンクリックで検索オーバーレイを表示
  const handleCenterButtonClick = () => {
    setShowSearch(true);
  };

  // 到着ハンドラー: 探索を終了し結果画面を表示
  const handleArrival = () => {
    setShowArrivalPopup(false);

    if (!mainDestination || !userLocation) return;

    // 経路ポイントを取得
    const pathPoints = [...collectedPathPointsRef.current];

    // 距離計算（Haversine）
    let totalDistance = 0;
    for (let i = 1; i < pathPoints.length; i++) {
      totalDistance += haversineDistance(
        pathPoints[i - 1].lat,
        pathPoints[i - 1].lng,
        pathPoints[i].lat,
        pathPoints[i].lng,
      );
    }
    // 経路ポイントが不十分な場合、直線距離をフォールバック
    if (pathPoints.length < 2) {
      totalDistance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        mainDestination.lat,
        mainDestination.lng,
      );
    }
    const distanceKm = Math.round(totalDistance * 10) / 10;

    // 所要時間計算
    const startTime = exploreStartTimeRef.current ?? new Date();
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - startTime.getTime()) / 60000),
    );

    // 結果画面用のデータをセット
    setResultPathPoints(pathPoints);
    setResultStartLocation({ lat: userLocation.lat, lng: userLocation.lng });
    setResultDestination({
      name: mainDestination.name,
      lat: mainDestination.lat,
      lng: mainDestination.lng,
    });
    setResultDistanceKm(distanceKm);
    setResultDurationMin(durationMin);

    // 経路履歴に保存
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    addRoute({
      id: `r-${Date.now()}`,
      date: dateStr,
      startTime: timeStr,
      startName: "現在地",
      endName: mainDestination.name,
      startLat: userLocation.lat,
      startLng: userLocation.lng,
      endLat: mainDestination.lat,
      endLng: mainDestination.lng,
      distanceKm,
      durationMin,
      pathPoints:
        pathPoints.length >= 2
          ? pathPoints
          : [
              { lat: userLocation.lat, lng: userLocation.lng },
              { lat: mainDestination.lat, lng: mainDestination.lng },
            ],
      places: [],
    });

    // 目的地ピンを削除
    if (mainDestinationMarkerRef.current) {
      mainDestinationMarkerRef.current.remove();
      mainDestinationMarkerRef.current = null;
    }
    setMainDestination(null);

    // GPS記録を停止
    setCurrentRecordId(null);
    setCurrentTargetPlaceId(null);

    // 結果画面を表示
    setShowExploreResult(true);
  };

  // Haversine距離計算 (km)
  const haversineDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 目的地選択後の処理（メイン目的地）
  const handleSelectDestination = async (dest: SearchDestination) => {
    setShowSearch(false);
    setMainDestination(dest);

    if (!userLocation) return;
    try {
      const res = await fetch("/api/records/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: userLocation.lat,
          startLng: userLocation.lng,
          destName: dest.name,
          destLat: dest.lat,
          destLng: dest.lng,
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
      // 経路ポイントの蓄積を初期化
      collectedPathPointsRef.current = [];
      exploreStartTimeRef.current = new Date();
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

          // OSMタイルレイヤー（常時表示、霧マスクで覆う）
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            layout: {
              visibility: "visible",
            },
            paint: {
              "raster-opacity": 1,
              "raster-saturation": -0.5,
            },
          },
        ],
      },
      center: [userLocation.lng, userLocation.lat],
      zoom: 17,
      pitch: 0,
      attributionControl: false,
    });

    // タイル読み込みエラーをログ
    map.on("error", (e) => {
      console.error("MapLibre error:", e.error?.message || e);
    });

    // マップクリックでポップアップカードを閉じる
    map.on("click", () => {
      setSelectedPlace(null);
    });

    // 霧マスク用のソースとレイヤーを追加（世界ポリゴンで地図を覆い、歩行経路を穴として切り抜く）
    map.on("load", () => {
      // 初期位置に小さな穴を開ける
      const initCircle = turfCircle(
        [userLocation.lng, userLocation.lat],
        0.03,
        { steps: 32, units: "kilometers" },
      );
      fogUnionRef.current = initCircle as Feature<Polygon>;
      walkedPathRef.current = [[userLocation.lng, userLocation.lat]];

      const worldOuter: [number, number][] = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];
      const hole = initCircle.geometry.coordinates[0] as [number, number][];
      const fogPoly = turfPolygon([worldOuter, hole]);

      map.addSource("fog-mask", {
        type: "geojson",
        data: fogPoly as any,
      });

      map.addLayer({
        id: "fog-mask-layer",
        type: "fill",
        source: "fog-mask",
        paint: {
          "fill-color": "#4ade80",
          "fill-opacity": 1,
        },
      });
    });

    // 現在地マーカー（me2.webp アイコン）
    const userEl = document.createElement("div");
    userEl.style.width = "100px";
    userEl.style.height = "100px";
    userEl.style.backgroundImage = 'url("/icon/me2.webp")';
    userEl.style.backgroundSize = "contain";
    userEl.style.backgroundRepeat = "no-repeat";
    userEl.style.backgroundPosition = "center";

    const userMarker = new maplibregl.Marker({
      element: userEl,
      anchor: "center",
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);
    userMarkerRef.current = userMarker;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, [userLocation]);

  // 常時位置トラッキング: 現在地マーカー追従 + 霧マスク更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    if (pathWatchIdRef.current != null) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        // 現在地マーカーを移動
        userMarkerRef.current?.setLngLat([lng, lat]);

        // マップ中央を追従
        map.easeTo({
          center: [lng, lat],
          duration: 300,
        });

        // 歩行経路に追加
        walkedPathRef.current.push([lng, lat]);

        // 霧マスクを更新（新しい位置に穴を追加）
        const newCircle = turfCircle([lng, lat], 0.03, {
          steps: 32,
          units: "kilometers",
        });

        try {
          if (fogUnionRef.current) {
            const fc = turfFc([
              fogUnionRef.current as Feature<Polygon | MultiPolygon>,
              newCircle as Feature<Polygon>,
            ]);
            const merged = turfUnion(fc);
            if (merged) {
              fogUnionRef.current = merged;
            }
          } else {
            fogUnionRef.current = newCircle as Feature<Polygon>;
          }

          // 霧マスクジオメトリを更新
          const src = map.getSource("fog-mask") as
            | maplibregl.GeoJSONSource
            | undefined;
          if (src && fogUnionRef.current) {
            const worldOuter: [number, number][] = [
              [-180, -90],
              [180, -90],
              [180, 90],
              [-180, 90],
              [-180, -90],
            ];
            const geom = fogUnionRef.current.geometry;
            let holes: [number, number][][];
            if (geom.type === "Polygon") {
              holes = [geom.coordinates[0] as [number, number][]];
            } else {
              // MultiPolygon: 各ポリゴンの外側リングを穴として使用
              holes = geom.coordinates.map(
                (poly) => poly[0] as [number, number][],
              );
            }
            const fogPoly = turfPolygon([worldOuter, ...holes]);
            src.setData(fogPoly as any);
          }
        } catch (e) {
          console.error("霧マスク更新エラー:", e);
        }
      },
      (err) => {
        console.error("常時位置トラッキングエラー:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
    );

    pathWatchIdRef.current = watchId;

    return () => {
      if (pathWatchIdRef.current != null) {
        navigator.geolocation.clearWatch(pathWatchIdRef.current);
        pathWatchIdRef.current = null;
      }
    };
  }, [userLocation]);

  // メイン目的地用の赤ピンを描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 既存のピンを削除
    if (mainDestinationMarkerRef.current) {
      mainDestinationMarkerRef.current.remove();
      mainDestinationMarkerRef.current = null;
    }

    if (!mainDestination) return;

    const el = document.createElement("div");
    el.style.width = "80px";
    el.style.height = "80px";
    el.style.backgroundImage = 'url("/icon/目的地.png")';
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";
    el.style.cursor = "pointer";

    // ピンクリックで到着ポップアップ表示
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      setShowArrivalPopup(true);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([mainDestination.lng, mainDestination.lat])
      .addTo(map);

    mainDestinationMarkerRef.current = marker;
  }, [mainDestination]);

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
        el.style.width = "80px";
        el.style.height = "80px";
        el.style.backgroundImage = `url("${iconPath}")`;
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "center";
        el.style.cursor = "pointer";

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

    if (map.isStyleLoaded()) {
      markers = addMarkers();
    } else {
      const onLoad = () => {
        markers = addMarkers();
      };
      map.once("load", onLoad);

      return () => {
        map.off("load", onLoad);
        markers.forEach((m) => m.remove());
      };
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [places, markerVersion]);

  // 発見スポットのマーカーを描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let markers: maplibregl.Marker[] = [];
    const addDiscoverMarkers = () => {
      void getDiscovered().then((discovered) => {
        markers.forEach((m) => m.remove());
        markers = [];

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

          const marker = new maplibregl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat([record.lng, record.lat])
            .addTo(map);

          markers.push(marker);
        });
      });
    };

    if (map.isStyleLoaded()) {
      addDiscoverMarkers();
    } else {
      const onLoad = () => {
        addDiscoverMarkers();
      };
      map.once("load", onLoad);

      return () => {
        map.off("load", onLoad);
        markers.forEach((m) => m.remove());
      };
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [markerVersion, userLocation]);

  // デバイスの向きに応じてマップを回転（現在地アイコンは固定）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || heading == null) return;

    map.easeTo({
      bearing: heading,
      duration: 200,
      easing: (t) => t, // 線形補間
    });
  }, [heading]);

  // マップの表示切替（Peek中は霧マスクを非表示にして全地図表示）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 霧マスク: Peek中は非表示、通常時は表示
    if (map.getLayer("fog-mask-layer")) {
      map.setLayoutProperty(
        "fog-mask-layer",
        "visibility",
        isPeeking ? "none" : "visible",
      );
    }

    if (map.getLayer("route-line")) {
      map.setLayoutProperty(
        "route-line",
        "visibility",
        isPeeking ? "visible" : "none",
      );
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

        // ローカルにも経路ポイントを蓄積（結果画面表示用）
        collectedPathPointsRef.current.push({
          lat: point.lat,
          lng: point.lng,
        });

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
    if (
      !isPeeking ||
      !userLocation ||
      !mainDestination ||
      routeGeometry ||
      isRouteLoading
    )
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
            destLat: mainDestination.lat,
            destLng: mainDestination.lng,
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
        setRouteError(e?.message ?? "経路の取得中にエラーが発生しました");
      } finally {
        setIsRouteLoading(false);
      }
    };

    fetchRoute();
  }, [isPeeking, userLocation, mainDestination, routeGeometry, isRouteLoading]);

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
          visibility: isPeeking ? "visible" : "none",
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 5,
          "line-opacity": 1,
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
          onRecenter={() => {
            const map = mapRef.current;
            if (!map || !userLocation) return;
            map.easeTo({
              center: [userLocation.lng, userLocation.lat],
              zoom: 17,
              duration: 500,
            });
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

      {/* ===== 到着ポップアップ（目的地ピンクリック時） ===== */}
      <ArrivalPopup
        show={showArrivalPopup}
        destinationName={mainDestination?.name ?? ""}
        onArrive={handleArrival}
        onClose={() => setShowArrivalPopup(false)}
      />

      {/* ===== 探索結果画面 ===== */}
      {resultStartLocation && resultDestination && (
        <ExploreResultOverlay
          show={showExploreResult}
          pathPoints={resultPathPoints}
          startLocation={resultStartLocation}
          destination={resultDestination}
          distanceKm={resultDistanceKm}
          durationMin={resultDurationMin}
          onClose={() => {
            setShowExploreResult(false);
            setResultPathPoints([]);
            setResultStartLocation(null);
            setResultDestination(null);
            collectedPathPointsRef.current = [];
            exploreStartTimeRef.current = null;
            setRouteGeometry(null);
          }}
        />
      )}

      {/* ===== 下部ナビゲーションバー ===== */}
      <BottomNavBar
        onCenterClick={handleCenterButtonClick}
        isLoading={isLoading}
      />
    </div>
  );
}
