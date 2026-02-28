"use client";

import type { Place } from "./types";

type Props = {
  isLoading: boolean;
  nearest: Place | null;
  /** 目的地が設定されている場合の名前 */
  destinationName?: string | null;
  /** リアルタイム距離（メートル）。目的地 or 最寄り店の距離 */
  liveDistanceM?: number | null;
};

/** 距離を見やすい文字列にフォーマット */
function formatDistance(meters: number): { value: string; unit: string } {
  if (meters >= 1000) {
    return { value: (meters / 1000).toFixed(1), unit: "km" };
  }
  return { value: String(Math.round(meters)), unit: "m" };
}

export default function NearestPlaceCard({
  isLoading,
  nearest,
  destinationName,
  liveDistanceM,
}: Props) {
  // 表示する名前: 目的地 > 最寄り店
  const displayName = destinationName || nearest?.name || null;
  // 表示する距離: リアルタイム距離 > API取得時の距離
  const distanceM = liveDistanceM ?? nearest?.distance ?? null;
  const dist = distanceM != null ? formatDistance(distanceM) : null;

  return (
    <div className="pointer-events-auto mb-4 flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-md backdrop-blur-md transition-all hover:bg-white active:scale-95">
      {isLoading && !displayName ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-600">探索中...</span>
        </div>
      ) : displayName && dist ? (
        <div className="flex items-center gap-3">
          {/* 距離の強調表示 */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-gray-500 font-bold">あと</span>
            <span className="text-xl font-extrabold text-green-600 tracking-tight">
              {dist.value}
            </span>
            <span className="text-xs text-gray-500 font-bold">{dist.unit}</span>
          </div>

          {/* 区切り線 */}
          <div className="h-4 w-px bg-gray-300" />

          {/* 店舗名 / 目的地名 */}
          <div className="flex items-center gap-1 max-w-[140px]">
            <span className="truncate text-sm font-bold text-gray-800">
              {displayName}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-500">近くにお店がありません</span>
      )}
    </div>
  );
}
