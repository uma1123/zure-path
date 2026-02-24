"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (target: string) => void;
};

export default function SearchOverlay({
  isOpen,
  onClose,
  onSelectDestination,
}: Props) {
  const [searchText, setSearchText] = useState("");

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
            {/* 履歴のダミー表示 */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 mb-2">履歴</h3>
              <ul className="space-y-4">
                {["〇△喫茶", "豊洲駅"].map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-gray-700 active:bg-gray-100 p-2 rounded"
                    onClick={() => onSelectDestination(item)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">🕒</span>{" "}
                      {/* 時計アイコンの代わり */}
                      <span>{item}</span>
                    </div>
                    <span className="text-gray-300">↗</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ここに検索結果リストなどを表示 */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
