"use client";

import { useEffect, useState } from "react";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません");
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
        maximumAge: 0,
      },
    );
  }, []);

  return { userLocation, locationError };
}
