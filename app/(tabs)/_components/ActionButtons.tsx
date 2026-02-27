"use client";

import Image from "next/image";

type Props = {
  isPeeking: boolean;
  onPeekStart: () => void;
  onPeekEnd: () => void;
  onDiscover: () => void;
  onRecenter: () => void;
};

export default function ActionButtons({
  isPeeking,
  onPeekStart,
  onPeekEnd,
  onDiscover,
  onRecenter,
}: Props) {
  return (
    <div className="absolute top-12 right-4 flex flex-col gap-3 pointer-events-auto">
      {/* 地図表示切替 */}
      <button
        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 ${
          isPeeking
            ? "bg-green-500 scale-110 ring-4 ring-green-200"
            : "bg-white/90 active:bg-gray-100"
        }`}
        onPointerDown={onPeekStart}
        onPointerUp={onPeekEnd}
        onPointerLeave={onPeekEnd}
      >
        <Image
          src="/images/change_map.svg"
          width={20}
          height={20}
          alt="Map View"
        />
      </button>
      {/* 発見 */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-md active:bg-yellow-500 border-2 border-white"
        onClick={onDiscover}
      >
        <Image
          src="/images/discover.svg"
          width={20}
          height={20}
          alt="Discover"
          style={{ width: "auto", height: "auto" }}
        />
      </button>
      {/* 現在地に戻る */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md active:bg-gray-100 backdrop-blur-sm"
        onClick={onRecenter}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  );
}
