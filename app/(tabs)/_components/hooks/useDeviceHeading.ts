"use client";

import { useEffect, useRef, useState } from "react";

/**
 * デバイスのコンパス方位（0〜360度、真北基準）を取得するフック
 * - iOS: webkitCompassHeading を使用
 * - Android: event.alpha を使用
 * - 最低5度の変化があった場合のみ更新（不要な再レンダリング防止）
 */
export function useDeviceHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    // DeviceOrientationEvent がサポートされていない場合は何もしない
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window))
      return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;

      // iOS: webkitCompassHeading が利用可能（真北基準、0〜360）
      if ("webkitCompassHeading" in event) {
        compassHeading =
          (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
            .webkitCompassHeading ?? null;
      }
      // Android: event.absolute === true の場合、alpha が真北基準
      else if (event.alpha != null) {
        // alpha は 0〜360（反時計回り）なので、時計回りに変換
        compassHeading = (360 - event.alpha) % 360;
      }

      if (compassHeading == null) return;

      // 最低5度の変化があった場合のみ更新
      const last = lastHeadingRef.current;
      if (last != null) {
        let diff = Math.abs(compassHeading - last);
        if (diff > 180) diff = 360 - diff;
        if (diff < 5) return;
      }

      lastHeadingRef.current = compassHeading;
      setHeading(compassHeading);
    };

    const startListening = () => {
      window.addEventListener("deviceorientation", handleOrientation, true);
    };

    // iOS 13+ では許可リクエストが必要
    const DeviceOrientationEventTyped =
      DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };

    if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
      DeviceOrientationEventTyped.requestPermission()
        .then((state) => {
          if (state === "granted") {
            startListening();
          } else {
            setPermissionDenied(true);
          }
        })
        .catch(() => {
          setPermissionDenied(true);
        });
    } else {
      // Android やデスクトップ（許可不要）
      startListening();
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  return { heading, permissionDenied };
}
