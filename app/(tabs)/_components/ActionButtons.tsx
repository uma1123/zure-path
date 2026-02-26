"use client";

import Image from "next/image";

type Props = {
  isPeeking: boolean;
  onPeekStart: () => void;
  onPeekEnd: () => void;
  onDiscover: () => void;
};

export default function ActionButtons({
  isPeeking,
  onPeekStart,
  onPeekEnd,
  onDiscover,
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
    </div>
  );
}
