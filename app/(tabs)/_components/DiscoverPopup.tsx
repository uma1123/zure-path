"use client";

import { useRef, useState } from "react";
import { FILTER_OPTIONS } from "../../../utils/category";
import { saveDiscovered } from "../../../utils/bookmarkStorage";

type Props = {
  show: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onSaved?: () => void;
};

export default function DiscoverPopup({
  show,
  onClose,
  userLocation,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [memo, setMemo] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    saveDiscovered(
      name.trim(),
      selectedCategory,
      memo,
      photoPreview ?? undefined,
      userLocation?.lat,
      userLocation?.lng,
    );
    // リセット
    setName("");
    setSelectedCategory("");
    setMemo("");
    setPhotoPreview(null);
    onSaved?.();
    onClose();
  };

  // カテゴリ一覧をフラットに取得
  const allCategories = FILTER_OPTIONS.flatMap((section) => section.items);

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

        <div className="px-5 pt-5">
          {/* タイトル */}
          <h2 className="text-base font-bold text-gray-900 mb-4">
            新しいスポットを発見
          </h2>

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

          {/* 場所の名前 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="場所の名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-gray-200 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors font-bold"
            />
          </div>

          {/* ジャンル設定 */}
          <div className="mb-4">
            <button
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="flex items-center gap-2 w-full border-b border-gray-200 py-2 text-sm text-left transition-colors"
            >
              <svg
                className="shrink-0 text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span
                className={selectedCategory ? "text-gray-700" : "text-gray-400"}
              >
                {selectedCategory || "ジャンルを選択"}
              </span>
              <svg
                className={`ml-auto text-gray-400 transition-transform ${showCategoryPicker ? "rotate-180" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M2 4L6 8L10 4" />
              </svg>
            </button>

            {/* カテゴリピッカー */}
            {showCategoryPicker && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-xl bg-gray-50 p-2">
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-600 border border-gray-200 active:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors"
            />
          </div>
        </div>

        {/* 登録ボタン */}
        <div className="px-5">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full rounded-full bg-yellow-400 py-3 text-sm font-bold text-white active:bg-yellow-500 transition-colors disabled:opacity-40"
          >
            発見した！
          </button>
        </div>
      </div>
    </div>
  );
}
