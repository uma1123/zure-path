"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDatesWithRoutes } from "../../../../utils/mockRouteHistory";

// ========================================
// カレンダーユーティリティ
// ========================================
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=日, 1=月, ...
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function HistoryPage() {
  const router = useRouter();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [datesWithRoutes, setDatesWithRoutes] = useState<Set<string>>(new Set());

  const fetchDatesWithRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/route-history");
      const data = await res.json();
      if (res.ok && data.status === "success" && Array.isArray(data.routes)) {
        const dates = [...new Set((data.routes as { date: string }[]).map((r) => r.date))];
        setDatesWithRoutes(new Set(dates));
        return;
      }
    } catch {
      // ignore
    }
    setDatesWithRoutes(new Set(getDatesWithRoutes()));
  }, []);

  // 経路が存在する日付を API から取得（マウント時＋画面表示時に再取得）
  useEffect(() => {
    fetchDatesWithRoutes();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchDatesWithRoutes();
    };
    window.addEventListener("focus", fetchDatesWithRoutes);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", fetchDatesWithRoutes);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchDatesWithRoutes]);

  // カレンダーデータ生成
  const calendarData = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const cells: (number | null)[] = [];

    // 月初の空白
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    // 日付
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDateStr = (day: number): string => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDateStr(day);
    router.push(`/bookmark/history/${dateStr}`);
  };

  const isToday = (day: number): boolean => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ===== ヘッダー ===== */}
      <div className="sticky top-0 z-20 bg-sky-300">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
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
            <h1 className="text-lg font-bold text-white">経路履歴</h1>
          </div>
        </div>
      </div>

      {/* ===== カレンダー ===== */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 月切り替えヘッダー */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h2 className="text-base font-bold text-gray-800">
              {viewYear}年 {viewMonth + 1}月
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={`text-center text-xs font-bold py-2 ${
                  i === 0
                    ? "text-red-400"
                    : i === 6
                      ? "text-blue-400"
                      : "text-gray-400"
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 px-3 pb-4">
            {calendarData.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-11" />;
              }

              const dateStr = formatDateStr(day);
              const hasRoute = datesWithRoutes.has(dateStr);
              const todayFlag = isToday(day);
              const dayOfWeek =
                (getFirstDayOfWeek(viewYear, viewMonth) + day - 1) % 7;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className="flex flex-col items-center justify-center h-11 relative"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                      ${
                        hasRoute
                          ? "bg-sky-400 text-white font-bold"
                          : todayFlag
                            ? "ring-2 ring-sky-300 text-sky-500 font-bold"
                            : dayOfWeek === 0
                              ? "text-red-400"
                              : dayOfWeek === 6
                                ? "text-blue-400"
                                : "text-gray-700"
                      }
                    `}
                  >
                    {day}
                  </span>
                  {/* 経路ありドットインジケータ */}
                  {hasRoute && (
                    <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== 凡例 ===== */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-400" />
            <span>経路あり</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full ring-2 ring-sky-300" />
            <span>今日</span>
          </div>
        </div>
      </div>
    </div>
  );
}
