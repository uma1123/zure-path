"use client";

import { useEffect, useRef, useState } from "react";

const THROTTLE_MS = 3000; // 位置更新スロットル（3秒）

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // 前回の更新から THROTTLE_MS 以内ならスキップ（初回は即座に反映）
        if (
          lastUpdateRef.current &&
          now - lastUpdateRef.current < THROTTLE_MS
        ) {
          return;
        }
        lastUpdateRef.current = now;
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("位置情報の使用が許可されていません");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("位置情報を取得できませんでした");
            break;
          case err.TIMEOUT:
            setLocationError("位置情報の取得がタイムアウトしました");
            break;
          default:
            setLocationError("位置情報の取得に失敗しました");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000, // スロットルに合わせたキャッシュ
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { userLocation, locationError };
}
