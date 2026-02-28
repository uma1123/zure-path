"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSelectedOsmTags } from "../../../../utils/categoryStorage";
import type { Place, ExploreResponse } from "../types";

const REFETCH_DISTANCE_M = 300; // 再フェッチ閾値（メートル）
const MAX_PLACES = 150; // 蓄積上限

// Place を一意に識別するキー（名前+座標）
function placeKey(p: Place): string {
  return `${p.name}::${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

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
  // 既知のPlaceキーを保持（重複排除用）
  const knownKeysRef = useRef<Set<string>>(new Set());

  // 周辺のお店を取得（300m以内ならキャッシュを利用）
  const fetchPlaces = useCallback(async () => {
    if (!userLocation) return;

    // 前回のフェッチ位置から REFETCH_DISTANCE_M 以内なら再リクエストしない
    if (lastFetchLocation.current) {
      const dist = getDistanceMeters(lastFetchLocation.current, userLocation);
      if (dist < REFETCH_DISTANCE_M) return;
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

      // マージ：既存 + 新規（重複排除）
      setPlaces((prev) => {
        const newPlaces: Place[] = [];
        for (const p of data.places) {
          const key = placeKey(p);
          if (!knownKeysRef.current.has(key)) {
            knownKeysRef.current.add(key);
            newPlaces.push(p);
          }
        }

        const merged = [...prev, ...newPlaces];

        // 上限を超えたら現在地から遠い順に削除
        if (merged.length > MAX_PLACES && userLocation) {
          merged.sort(
            (a, b) =>
              getDistanceMeters(userLocation, a) -
              getDistanceMeters(userLocation, b),
          );
          // 削除分のキーをSetから除去
          const removed = merged.slice(MAX_PLACES);
          for (const r of removed) {
            knownKeysRef.current.delete(placeKey(r));
          }
          return merged.slice(0, MAX_PLACES);
        }

        return merged;
      });

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

  // 現在地が更新されるたびに閾値チェック→APIを呼ぶ
  useEffect(() => {
    if (userLocation) {
      fetchPlaces();
    }
  }, [userLocation, fetchPlaces]);

  return { places, isLoading, fetchError };
}
