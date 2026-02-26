"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FILTER_OPTIONS } from "../../../../utils/category";
import {
  getSelectedCategories,
  saveSelectedCategories,
} from "../../../../utils/categoryStorage";

export default function CategorySettingsPage() {
  const router = useRouter();

  // category.ts の定義を使用
  const filterOptions = FILTER_OPTIONS;

  // 選択状態の管理（localStorageから読み込み）
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 初回マウント時にlocalStorageから読み込み
  useEffect(() => {
    setSelectedItems(getSelectedCategories());
  }, []);

  // 選択切り替え処理
  const toggleItem = (item: string) => {
    const next = selectedItems.includes(item)
      ? selectedItems.filter((i) => i !== item)
      : [...selectedItems, item];
    setSelectedItems(next);
    saveSelectedCategories(next);
  };

  // セクションごとの全選択/全解除（オプション機能）
  const toggleSection = (items: string[]) => {
    const allSelected = items.every((i) => selectedItems.includes(i));
    let next: string[];
    if (allSelected) {
      // 全解除
      next = selectedItems.filter((i) => !items.includes(i));
    } else {
      // 全選択（未選択のものだけ足す）
      const newItems = items.filter((i) => !selectedItems.includes(i));
      next = [...selectedItems, ...newItems];
    }
    setSelectedItems(next);
    saveSelectedCategories(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* ===== ヘッダーエリア ===== */}
      <div className="relative flex items-center justify-center bg-white px-4 py-4 pt-6 shadow-sm z-10">
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* タイトル */}
        <h1 className="text-base font-bold text-gray-700">カテゴリー</h1>
      </div>

      {/* ===== リストエリア ===== */}
      <div className="mt-2">
        {filterOptions.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {/* セクションヘッダー */}
            <div
              className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 flex items-center justify-between cursor-pointer active:bg-gray-100"
              onClick={() => toggleSection(section.items)}
            >
              <span>{section.label}</span>
              <span className="text-[10px] text-blue-500 font-normal">
                {section.items.every((i) => selectedItems.includes(i))
                  ? "解除"
                  : "全選択"}
              </span>
            </div>

            {/* リストアイテム */}
            <div className="bg-white border-t border-b border-gray-100">
              {section.items.map((item, itemIndex) => {
                const isSelected = selectedItems.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`flex w-full items-center justify-between px-6 py-3.5 text-sm text-gray-700 active:bg-gray-50 transition-colors ${
                      itemIndex !== section.items.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{item}</span>
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-blue-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
