"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSelectedOsmTags } from "../../../../utils/categoryStorage";
import type { Place, ExploreResponse } from "../types";

// 2点間の距離を簡易計算（キャッシュ判定用）
function getDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useFetchPlaces(
  userLocation: { lat: number; lng: number } | null,
) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null);

  // 周辺のお店を取得（50m以内ならキャッシュを利用）
  const fetchPlaces = useCallback(async () => {
    if (!userLocation) return;

    // 前回のフェッチ位置から50m以内なら再リクエストしない
    if (lastFetchLocation.current) {
      const dist = getDistanceMeters(lastFetchLocation.current, userLocation);
      if (dist < 50) return;
    }

    setIsLoading(true);
    setFetchError(null);

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
        setFetchError(data.detail || "お店の取得に失敗しました");
        return;
      }

      setPlaces(data.places);
      lastFetchLocation.current = {
        lat: userLocation.lat,
        lng: userLocation.lng,
      };
    } catch {
      setFetchError("通信エラーが発生しました");
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

  return { places, isLoading, fetchError };
}
