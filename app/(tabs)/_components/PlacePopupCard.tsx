"use client";

import type { Place } from "./types";
import { getCategoryDisplay } from "../../../utils/category";
import { saveWanted } from "../../../utils/bookmarkStorage";

type Props = {
  selectedPlace: Place;
  onClose: () => void;
  onVisited: (place: Place) => void;
};

export default function PlacePopupCard({
  selectedPlace,
  onClose,
  onVisited,
}: Props) {
  const display = getCategoryDisplay(selectedPlace.category || "");

  return (
    <div
      className="absolute bottom-28 left-4 right-4 z-20"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl bg-white shadow-xl p-4">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200 z-10"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* カード上部: 情報 + 画像 */}
        <div className="flex gap-3">
          {/* 左: テキスト情報 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate pr-6">
              {selectedPlace.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{display.label}</p>
          </div>

          {/* 右: カテゴリ画像 */}
          <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden">
            <img
              src={display.image}
              alt={display.label}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* カード下部: アクションボタン */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => {
              onVisited(selectedPlace);
            }}
            className="flex-1 rounded-full bg-green-500 py-2.5 text-sm font-bold text-white active:bg-green-600 transition-colors"
          >
            行った
          </button>
          <button
            onClick={() => {
              saveWanted(selectedPlace);
              onClose();
            }}
            className="flex-1 rounded-full border-2 border-green-500 py-2.5 text-sm font-bold text-green-600 active:bg-green-50 transition-colors"
          >
            行きたい
          </button>
        </div>
      </div>
    </div>
  );
}
