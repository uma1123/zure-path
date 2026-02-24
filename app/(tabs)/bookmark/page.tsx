"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// 型定義
type Record = {
  id: string;
  name: string;
  date: string; // "2月3日" など (ソート用に内部で日付変換できる想定ですが今回はモックなのでそのまま)
  rawDate: string; // ソート用の日付データ (YYYY-MM-DD)
  category: string; // "カフェ", "公園" など
  time?: string;
  distance?: string; // "300m" など
  rating?: number;
  comment?: string;
  imageUrl?: string;
};

// 距離文字列("300m", "2.3km")をメートル数値に変換するヘルパー関数
const parseDistance = (distStr?: string): number => {
  if (!distStr) return Infinity;
  if (distStr.includes("km")) {
    return parseFloat(distStr.replace("km", "")) * 1000;
  }
  return parseFloat(distStr.replace("m", ""));
};

export default function BookmarkPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "visited" | "wanted" | "discovered"
  >("visited");

  // メニュー開閉状態
  const [openMenu, setOpenMenu] = useState<"none" | "sort" | "filter">("none");

  // 並び替え状態
  const [sortType, setSortType] = useState<"newest" | "oldest" | "closest">(
    "newest",
  );

  // 絞り込み状態（選択されたカテゴリの配列）
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // ==========================================
  // モックデータ定義 (ソート用に rawDate を追加)
  // ==========================================
  const visitedData: Record[] = [
    {
      id: "v1",
      name: "shibaura coffee",
      date: "2月3日",
      rawDate: "2026-02-03",
      category: "カフェ",
      time: "11:00-18:00",
      distance: "300m",
      rating: 5,
      comment: "店内が落ち着いた雰囲気でまた一人で来たい",
    },
    {
      id: "v2",
      name: "さんかく公園",
      date: "2月3日",
      rawDate: "2026-02-03",
      category: "公園",
      time: "24時間営業",
      distance: "2.3km",
      rating: 4,
      comment: "疲れたらこの公園のベンチで缶コーヒーを飲みたい",
    },
    {
      id: "v3",
      name: "らーめんいちばん",
      date: "1月29日",
      rawDate: "2026-01-29",
      category: "ラーメン",
      time: "17:00-5:00",
      distance: "2km",
      rating: 3,
      comment: "自分には味が少し濃かった",
    },
  ];

  const wantedData: Record[] = [
    {
      id: "w1",
      name: "代官山 蔦屋書店",
      date: "登録日: 2月10日",
      rawDate: "2026-02-10",
      category: "本屋",
      time: "9:00-23:00",
      distance: "5.2km",
    },
    {
      id: "w2",
      name: "ブルーボトルコーヒー",
      date: "登録日: 2月8日",
      rawDate: "2026-02-08",
      category: "カフェ",
      time: "8:00-19:00",
      distance: "1.2km",
    },
    {
      id: "w3",
      name: "東京都現代美術館",
      date: "登録日: 1月15日",
      rawDate: "2026-01-15",
      category: "美術館",
      time: "10:00-18:00",
      distance: "8km",
    },
  ];

  const discoveredData: Record[] = [
    {
      id: "d1",
      name: "裏路地のパン屋",
      date: "発見日: 2月14日",
      rawDate: "2026-02-14",
      category: "パン",
      distance: "450m",
    },
    {
      id: "d2",
      name: "変な形のポスト",
      date: "発見日: 2月14日",
      rawDate: "2026-02-14",
      category: "スポット",
      distance: "120m",
    },
    {
      id: "d3",
      name: "謎の石碑",
      date: "発見日: 1月30日",
      rawDate: "2026-01-30",
      category: "史跡",
      distance: "3km",
    },
  ];

  // ==========================================
  // カテゴリ定義（絞り込み用）
  // ==========================================
  const filterOptions = [
    {
      label: "すべての飲食店",
      items: ["レストラン", "カフェ", "居酒屋", "ラーメン", "パン"],
    },
    {
      label: "すべてのショッピング",
      items: ["本屋", "花屋", "雑貨"],
    },
    {
      label: "すべてのおすすめ",
      items: ["公園", "土手", "美術館", "スポット", "史跡"],
    },
  ];

  // 全カテゴリリスト（初期化や全選択用）
  const allCategories = filterOptions.flatMap((g) => g.items);

  // カテゴリ選択のトグル処理
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // ==========================================
  // データ処理ロジック (フィルタリング -> ソート)
  // ==========================================
  const processedData = useMemo(() => {
    let data =
      activeTab === "visited"
        ? visitedData
        : activeTab === "wanted"
          ? wantedData
          : discoveredData;

    // 1. 絞り込み
    if (selectedCategories.length > 0) {
      data = data.filter((item) => selectedCategories.includes(item.category));
    }

    // 2. 並び替え
    data = [...data].sort((a, b) => {
      if (sortType === "newest") {
        return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
      } else if (sortType === "oldest") {
        return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
      } else if (sortType === "closest") {
        return parseDistance(a.distance) - parseDistance(b.distance);
      }
      return 0;
    });

    return data;
  }, [activeTab, sortType, selectedCategories]);

  // 日付ごとのグループ化
  const groupedData = processedData.reduce(
    (acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    },
    {} as Record<string, Record[]>,
  );

  const dates = Object.keys(groupedData);

  // メニュー外クリックで閉じるための背景
  const Overlay = () => (
    <div
      className="fixed inset-0 z-10"
      onClick={() => setOpenMenu("none")}
    ></div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* ===== ヘッダーエリア ===== */}
      <div className="sticky top-0 z-20 bg-sky-300 pb-0">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="text-white p-1 -ml-2"
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
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
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
                placeholder="目的地を検索"
                className="w-full rounded-full bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex bg-white text-sm font-bold text-gray-400 shadow-sm">
          {["visited", "wanted", "discovered"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                setOpenMenu("none");
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-sky-400 text-sky-400"
                  : "border-transparent hover:text-gray-600"
              }`}
            >
              {tab === "visited"
                ? "行った"
                : tab === "wanted"
                  ? "行きたい"
                  : "発見"}
            </button>
          ))}
        </div>
      </div>

      {/* ===== サブメニュー（並び替え・絞り込みボタン） ===== */}
      <div className="relative z-10 flex items-center justify-between bg-white px-4 py-3 text-xs font-bold text-gray-500 border-b border-gray-100 shadow-sm">
        {/* 並び替えボタン */}
        <button
          onClick={() => setOpenMenu(openMenu === "sort" ? "none" : "sort")}
          className={`flex items-center gap-1 transition-colors ${
            openMenu === "sort" ? "text-sky-500" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
          </svg>
          {sortType === "newest"
            ? "新しい順"
            : sortType === "oldest"
              ? "古い順"
              : "現在地から近い順"}
        </button>

        {/* 絞り込みボタン */}
        <button
          onClick={() => setOpenMenu(openMenu === "filter" ? "none" : "filter")}
          className={`flex items-center gap-1 transition-colors ${
            openMenu === "filter" || selectedCategories.length > 0
              ? "text-sky-500"
              : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
            />
          </svg>
          絞り込み{" "}
          {selectedCategories.length > 0 && `(${selectedCategories.length})`}
        </button>

        {/* ===== ポップアップメニュー ===== */}
        {openMenu !== "none" && <Overlay />}

        {/* 1. 並び替えメニュー */}
        {openMenu === "sort" && (
          <div className="absolute top-full left-2 mt-2 w-56 rounded-lg bg-white shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-20">
            <div className="flex flex-col py-1">
              {[
                { label: "新しい順", value: "newest" },
                { label: "古い順", value: "oldest" },
                { label: "現在地から近い順", value: "closest" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortType(option.value as any);
                    setOpenMenu("none");
                  }}
                  className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-left"
                >
                  {option.label}
                  {sortType === option.value && (
                    <span className="text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. 絞り込みメニュー */}
        {openMenu === "filter" && (
          <div className="absolute top-full right-2 mt-2 w-64 rounded-lg bg-white shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-20">
            <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 border-b border-gray-100">
              カテゴリー
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filterOptions.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className="border-b border-gray-50 last:border-0"
                >
                  <div className="px-4 py-2 text-xs text-gray-400 mt-1">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const isSelected = selectedCategories.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleCategory(item)}
                        className="w-full flex items-center justify-between px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-left"
                      >
                        {item}
                        {isSelected && <span className="text-blue-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* フィルターリセットボタン */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={() => setSelectedCategories([])}
                className="text-xs text-gray-500 hover:text-red-500 py-1"
                disabled={selectedCategories.length === 0}
              >
                選択をクリア
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== リストエリア ===== */}
      <div className="px-4 py-4 space-y-6">
        {dates.length > 0 ? (
          dates.map((dateKey) => (
            <div key={dateKey}>
              {/* 日付見出し */}
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                {dateKey}
              </h3>
              {/* その日のリスト */}
              <div className="space-y-6">
                {groupedData[dateKey].map((item) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    isVisited={activeTab === "visited"}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-2">
              条件に合う場所が見つかりません
            </p>
            <button
              onClick={() => setSelectedCategories([])}
              className="text-sky-500 text-sm font-bold"
            >
              条件をクリア
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// リストアイテムコンポーネント（前回と同じ）
function ListItem({ item, isVisited }: { item: Record; isVisited: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-base font-bold text-gray-800 truncate mb-1">
          {item.name}
        </h4>
        {isVisited && item.rating && (
          <div className="flex text-yellow-400 text-sm mb-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < (item.rating || 0) ? "text-yellow-400" : "text-gray-300"
                }
              >
                ★
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">
            {item.category}
          </span>
          {item.time && <span>{item.time}</span>}
          {item.distance && <span>{item.distance}</span>}
        </div>
        {isVisited && item.comment && (
          <div className="flex items-start gap-1 text-xs text-gray-600 mt-1">
            <span className="text-gray-400 mt-0.5">✎</span>
            <p className="line-clamp-2 leading-relaxed">{item.comment}</p>
          </div>
        )}
      </div>
      <div className="w-28 h-20 shrink-0 bg-gray-200 rounded-md overflow-hidden relative shadow-sm">
        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
          {item.imageUrl ? (
            <span className="text-xs">Image</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
