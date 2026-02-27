"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export type Destination = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: Destination) => void;
};

const HISTORY_KEY = "zeropath_search_history";

export default function SearchOverlay({
  isOpen,
  onClose,
  onSelectDestination,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Destination[]>([]);
  const [history, setHistory] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索履歴の読み込み
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Destination[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      // 破損していたら無視
    }
  }, []);

  const saveHistory = (dest: Destination) => {
    if (typeof window === "undefined") return;
    setHistory((prev) => {
      const exists = prev.some(
        (h) =>
          h.name === dest.name &&
          h.lat === dest.lat &&
          h.lng === dest.lng,
      );
      const next = exists ? prev : [dest, ...prev].slice(0, 10);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // 保存失敗は無視
      }
      return next;
    });
  };

  const handleChoose = (dest: Destination) => {
    saveHistory(dest);
    onSelectDestination(dest);
    onClose();
  };

  const handleSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setIsSearching(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(
        `/api/destinations/search?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.detail || data.message || "検索に失敗しました");
      }
      const dests = (data.results as Destination[]) ?? [];
      setResults(dests);
    } catch (e: any) {
      setError(e?.message ?? "検索中にエラーが発生しました");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }} // 初期位置：画面の下外側
          animate={{ y: 0 }} // アニメーション後：画面にピッタリ収まる
          exit={{ y: "100%" }} // 閉じる時：また下へ帰る
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-gray-50 flex flex-col"
          // ↑ z-50で地図より手前に表示。fixed inset-0で全画面化
        >
          {/* ヘッダーエリア（検索バー） */}
          <div className="bg-white px-4 py-4 border-b border-gray-200 flex items-center gap-2 pt-12 pb-4">
            {/* 検索アイコン */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="目的地を検索"
                className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>

            {/* キャンセルボタン */}
            <button
              onClick={onClose}
              className="text-green-600 font-bold text-sm whitespace-nowrap px-2"
            >
              キャンセル
            </button>
          </div>

          {/* コンテンツエリア（履歴など） */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <p className="mb-4 text-xs text-red-500 text-center">{error}</p>
            )}

            {/* 検索結果 */}
            {isSearching && (
              <p className="text-xs text-gray-500 mb-4 text-center">
                検索中です…
              </p>
            )}

            {results.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 mb-2">
                  検索結果
                </h3>
                <ul className="space-y-3">
                  {results.map((dest, i) => (
                    <li
                      key={`${dest.name}-${i}`}
                      className="flex justify-between items-center text-gray-700 active:bg-gray-100 p-2 rounded cursor-pointer"
                      onClick={() => handleChoose(dest)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate">
                          {dest.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({dest.lat.toFixed(5)}, {dest.lng.toFixed(5)})
                        </span>
                      </div>
                      <span className="text-gray-300 text-xs">↗</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 履歴表示（結果がないとき or 併記してもよい） */}
            {history.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 mb-2">履歴</h3>
                <ul className="space-y-3">
                  {history.map((dest, i) => (
                    <li
                      key={`${dest.name}-${i}`}
                      className="flex justify-between items-center text-gray-600 active:bg-gray-100 p-2 rounded cursor-pointer"
                      onClick={() => handleChoose(dest)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm truncate">{dest.name}</span>
                      </div>
                      <span className="text-gray-300 text-xs">↗</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
