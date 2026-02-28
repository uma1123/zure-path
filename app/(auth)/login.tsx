"use client";

import Image from "next/image";
import { useState } from "react";
import { signInWithGoogle } from "@/utils/supabase/auth-client";

/** ピンアイコンの配置データ */
const PIN_ICONS = [
  {
    src: "/icon/kankou_4.webp",
    alt: "観光",
    top: "8%",
    left: "5%",
    starTop: "6%",
    starLeft: "20%",
    size: 72,
  },
  {
    src: "/icon/inshoku_4.webp",
    alt: "飲食",
    top: "5%",
    right: "10%",
    starTop: "3%",
    starRight: "8%",
    size: 64,
  },
  {
    src: "/icon/noodle_4.webp",
    alt: "麺類",
    top: "35%",
    left: "2%",
    starTop: "33%",
    starLeft: "18%",
    size: 60,
  },
  {
    src: "/icon/shop_4.webp",
    alt: "ショップ",
    top: "30%",
    right: "3%",
    starTop: "28%",
    starRight: "5%",
    size: 64,
  },
  {
    src: "/icon/park_4.webp",
    alt: "公園",
    bottom: "12%",
    left: "8%",
    starBottom: "18%",
    starLeft: "22%",
    size: 60,
  },
  {
    src: "/icon/entame_4.webp",
    alt: "エンタメ",
    bottom: "8%",
    right: "5%",
    starBottom: "14%",
    starRight: "18%",
    size: 68,
  },
] as const;

export function Login() {
  const [error, setError] = useState("");

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-[#e8f5e9] px-6">
      {/* 装飾ピンアイコン */}
      {PIN_ICONS.map((pin) => {
        const posStyle: React.CSSProperties = {};
        if ("top" in pin && pin.top) posStyle.top = pin.top;
        if ("bottom" in pin && pin.bottom) posStyle.bottom = pin.bottom;
        if ("left" in pin && pin.left) posStyle.left = pin.left;
        if ("right" in pin && pin.right) posStyle.right = pin.right;

        const starStyle: React.CSSProperties = { position: "absolute" };
        if ("starTop" in pin && pin.starTop) starStyle.top = pin.starTop;
        if ("starBottom" in pin && pin.starBottom)
          starStyle.bottom = pin.starBottom;
        if ("starLeft" in pin && pin.starLeft) starStyle.left = pin.starLeft;
        if ("starRight" in pin && pin.starRight)
          starStyle.right = pin.starRight;

        return (
          <div key={pin.src}>
            {/* ピンアイコン */}
            <div className="absolute" style={posStyle}>
              <Image
                src={pin.src}
                alt={pin.alt}
                width={pin.size}
                height={pin.size}
                className="pointer-events-none select-none"
                priority
              />
            </div>
            {/* 星の装飾 */}
            <span
              className="absolute text-amber-400 text-xs pointer-events-none select-none"
              style={starStyle}
            >
              ✦
            </span>
          </div>
        );
      })}

      {/* 中央コンテンツ */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          MapBook
        </h1>
        <p className="text-base text-gray-500">地図で楽しく本を探そう</p>
      </div>

      {/* ログインボタン */}
      <div className="relative z-10 mt-12 w-full max-w-xs">
        <button
          type="button"
          onClick={async () => {
            try {
              setError("");
              await signInWithGoogle();
            } catch (err) {
              console.error("[login] google auth error", err);
              setError("Google ログインに失敗しました");
            }
          }}
          className="w-full flex items-center justify-center gap-3 rounded-full bg-white py-3.5 px-6 text-base font-medium text-gray-900 shadow-sm border border-gray-200 active:bg-gray-50"
        >
          {/* Google "G" アイコン */}
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.08 24.08 0 0 0 0 21.56l7.98-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Googleでログイン
        </button>

        {error && (
          <div className="mt-3 text-center text-sm text-red-500" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* 利用規約・プライバシーポリシー */}
      <div className="relative z-10 mt-8 w-full max-w-xs text-center text-sm text-gray-500 leading-relaxed">
        ログインすることで
        <a href="#" className="text-green-600 underline underline-offset-2">
          利用規約
        </a>
        と
        <br />
        <a href="#" className="text-green-600 underline underline-offset-2">
          プライバシーポリシー
        </a>
        に同意したものとみなされます
      </div>
    </div>
  );
}
