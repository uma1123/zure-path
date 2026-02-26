"use client";

import { useRef, useState } from "react";
import type { Place } from "./types";
import { getCategoryDisplay } from "../../../utils/category";
import { saveVisited } from "../../../utils/bookmarkStorage";

type Props = {
  show: boolean;
  nearest: Place;
  onClose: () => void;
};

export default function VisitedPopup({ show, nearest, onClose }: Props) {
  const [discoverRating, setDiscoverRating] = useState(0);
  const [discoverMemo, setDiscoverMemo] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const display = getCategoryDisplay(nearest.category || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 active:bg-gray-300"
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

        {/* === 上部: 撮影・評価・メモ === */}
        <div className="px-5 pt-5">
          {/* 撮影エリア */}
          <div
            className="relative flex items-center justify-center rounded-2xl bg-gray-100 h-40 mb-4 cursor-pointer active:opacity-80 overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="撮影した写真"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-sm font-medium">撮影する</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhotoPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          {/* 星評価 */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setDiscoverRating(star)}
                className="p-0.5"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={star <= discoverRating ? "#FBBF24" : "none"}
                  stroke={star <= discoverRating ? "#FBBF24" : "#D1D5DB"}
                  strokeWidth="1.5"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {/* ひとことメモ */}
          <div className="flex items-start gap-2 mb-4">
            <svg
              className="mt-2.5 shrink-0 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <input
              type="text"
              placeholder="ひとことメモ"
              value={discoverMemo}
              onChange={(e) => setDiscoverMemo(e.target.value)}
              className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors"
            />
          </div>
        </div>

        {/* 区切り線 */}
        <div className="h-px bg-gray-100 mx-5 mb-4" />

        {/* === 下部: スポット情報 === */}
        <div className="px-5">
          <div className="flex gap-3 mb-4">
            {/* 左: テキスト情報 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {nearest.name}
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

          {/* 行ったボタン */}
          <button
            onClick={() => {
              saveVisited(
                nearest,
                discoverRating || undefined,
                discoverMemo || undefined,
                photoPreview ?? undefined,
              );
              setDiscoverRating(0);
              setDiscoverMemo("");
              setPhotoPreview(null);
              onClose();
            }}
            className="w-full rounded-full bg-green-500 py-3 text-sm font-bold text-white active:bg-green-600 transition-colors"
          >
            発見した
          </button>
        </div>
      </div>
    </div>
  );
}
