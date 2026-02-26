"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  onCenterClick: () => void;
  isLoading: boolean;
};

export default function BottomNavBar({ onCenterClick, isLoading }: Props) {
  const router = useRouter();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pb-[env(safe-area-inset-bottom)]">
      {/* SVGを使った背景コンテナ */}
      <div className="relative w-full h-[90px]">
        <svg
          className="absolute bottom-0 w-full h-auto filter drop-shadow-[0_-6px_24px_rgba(0,0,0,0.10)]"
          viewBox="0 0 375 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* 湾曲した背景 */}
          <path
            d="M0 90V35C0 35 80 10 187.5 10C295 10 375 35 375 35V90H0Z"
            fill="white"
          />
        </svg>

        {/* ボタン配置用コンテナ */}
        <div className="absolute inset-0 pointer-events-none">
          {" "}
          {/* pointer-events-noneで背後のSVGへのクリックを妨げない */}
          {/* 左ボタン: ブックマーク */}
          <button
            className="absolute flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 pointer-events-auto"
            style={{
              left: "18%",
              bottom: "10px",
              width: "50px",
              height: "50px",
            }}
            onClick={() => {
              router.push("/bookmark");
            }}
          >
            <Image
              src="/images/saved.svg"
              width={40}
              height={40}
              alt="Bookmark"
            />
          </button>
          {/* 中央ボタン:目的地検索*/}
          <button
            onClick={onCenterClick}
            disabled={isLoading}
            className="absolute flex items-center justify-center rounded-full bg-green-500 shadow-xl transition-transform active:scale-95 disabled:opacity-60 pointer-events-auto"
            style={{
              left: "50%",
              top: "0",
              transform: "translate(-50%, -10%)",
              width: "64px",
              height: "64px",
            }}
          >
            {isLoading ? (
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              <Image
                src="/images/destination.svg"
                width={48}
                height={48}
                alt="Location"
                priority
              />
            )}
          </button>
          {/* 右ボタン: 設定 */}
          <button
            className="absolute flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 pointer-events-auto"
            style={{
              right: "18%",
              bottom: "10px",
              width: "50px",
              height: "50px",
            }}
            onClick={() => router.push("/settings")}
          >
            <Image
              src="/images/setting.svg"
              width={40}
              height={40}
              alt="Settings"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
