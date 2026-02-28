"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type PathPoint = {
  lat: number;
  lng: number;
};

type Props = {
  show: boolean;
  pathPoints: PathPoint[];
  startLocation: { lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  distanceKm: number;
  durationMin: number;
  onClose: () => void;
};

export default function ExploreResultOverlay({
  show,
  pathPoints,
  startLocation,
  destination,
  distanceKm,
  durationMin,
  onClose,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!show || !mapContainerRef.current) return;

    // 既存のマップがあれば破棄
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [destination.lng, destination.lat],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 経路ライン描画
      const coordinates =
        pathPoints.length > 0
          ? pathPoints.map((p) => [p.lng, p.lat])
          : [
              [startLocation.lng, startLocation.lat],
              [destination.lng, destination.lat],
            ];

      map.addSource("result-route", {
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
        id: "result-route-line",
        type: "line",
        source: "result-route",
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

      // スタートマーカー
      const startEl = document.createElement("div");
      startEl.style.cssText =
        "width:28px;height:28px;border-radius:4px;background:#3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);";
      startEl.innerText = "S";
      new maplibregl.Marker({ element: startEl })
        .setLngLat([startLocation.lng, startLocation.lat])
        .addTo(map);

      // ゴールマーカー（赤ピン + 「到着しました」ラベル）
      const endContainer = document.createElement("div");
      endContainer.style.cssText =
        "display:flex;flex-direction:column;align-items:center;";

      // ラベル部分
      const label = document.createElement("div");
      label.style.cssText =
        "background:white;border-radius:8px;padding:4px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin-bottom:4px;white-space:nowrap;font-size:13px;font-weight:bold;color:#333;";
      label.innerText = "到着しました";
      endContainer.appendChild(label);

      // 赤ピン
      const pin = document.createElement("div");
      pin.innerHTML = `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`;
      endContainer.appendChild(pin);

      new maplibregl.Marker({ element: endContainer, anchor: "bottom" })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);

      // 全経路が表示されるようにバウンドを調整
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [show, pathPoints, startLocation, destination]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-green-400/90">
      {/* 上部の装飾（既存の背景パターンと統一） */}
      <div className="flex-1 relative overflow-hidden">
        {/* 地図表示エリア */}
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-16">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white">
            {/* 「到着しました」ヘッダー */}
            <div className="bg-white px-4 pt-3 pb-2">
              <div className="flex items-center justify-center gap-2">
                <svg
                  width="16"
                  height="20"
                  viewBox="0 0 24 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                    fill="#ef4444"
                  />
                  <circle cx="12" cy="12" r="5" fill="white" />
                </svg>
                <span className="text-sm font-bold text-gray-700">
                  到着しました
                </span>
              </div>
            </div>

            {/* 地図 */}
            <div
              ref={mapContainerRef}
              className="w-full"
              style={{ height: "280px" }}
            />
          </div>
        </div>
      </div>

      {/* 下部: 距離・時間 + 閉じるボタン */}
      <div className="pb-10 px-6">
        {/* 距離・時間バー */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="text-lg font-bold text-white">
            {distanceKm}km/{durationMin}min
          </span>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="w-full max-w-md mx-auto block rounded-full bg-green-600 py-3.5 text-base font-bold text-white active:bg-green-700 transition-colors shadow-lg"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
