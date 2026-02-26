"use client";

import type { Place } from "./types";

type Props = {
  isLoading: boolean;
  nearest: Place | null;
};

export default function NearestPlaceCard({ isLoading, nearest }: Props) {
  return (
    <div className="pointer-events-auto mb-4 flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-md backdrop-blur-md transition-all hover:bg-white active:scale-95">
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-600">探索中...</span>
        </div>
      ) : nearest ? (
        <div className="flex items-center gap-3">
          {/* 距離の強調表示 */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-gray-500 font-bold">あと</span>
            <span className="text-xl font-extrabold text-green-600 tracking-tight">
              {nearest.distance}
            </span>
            <span className="text-xs text-gray-500 font-bold">m</span>
          </div>

          {/* 区切り線 */}
          <div className="h-4 w-px bg-gray-300" />

          {/* 店舗名 */}
          <div className="flex items-center gap-1 max-w-[140px]">
            <span className="truncate text-sm font-bold text-gray-800">
              {nearest.name}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-500">近くにお店がありません</span>
      )}
    </div>
  );
}
