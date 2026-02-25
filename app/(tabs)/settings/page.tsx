"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  // 設定項目のデータ定義
  const menuItems = [
    {
      id: "category",
      label: "表示カテゴリー",
      icon: (
        <Image
          src="/images/set.svg"
          width={24}
          height={24}
          alt="表示カテゴリー"
        />
      ),
    },
    {
      id: "notification",
      label: "通知",
      icon: <Image src="/images/alerm.svg" width={24} height={24} alt="通知" />,
    },
    {
      id: "help",
      label: "ヘルプ",
      icon: (
        <Image src="/images/help.svg" width={24} height={24} alt="ヘルプ" />
      ),
    },
    {
      id: "terms",
      label: "利用規約",
      icon: (
        <Image src="/images/rule.svg" width={24} height={24} alt="利用規約" />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== ヘッダーエリア ===== */}
      <div className="relative flex items-center justify-center px-4 py-4 pt-6">
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white shadow-sm hover:bg-gray-500 active:scale-95 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5 -ml-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* タイトル */}
        <h1 className="text-lg font-bold text-gray-700">設定</h1>
      </div>

      {/* ===== 設定リスト ===== */}
      <div className="mt-6 space-y-0.5 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              // ここに各ページへの遷移処理などを書く
              if (item.id === "category") {
                router.push("/settings/category");
              }
              console.log(`${item.label} clicked`);
            }}
            className="flex w-full items-center justify-between rounded-none first:rounded-t-xl last:rounded-b-xl bg-gray-50 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* アイコン */}
              <div className="text-green-500">{item.icon}</div>
              {/* ラベル */}
              <span className="text-sm font-bold text-gray-600">
                {item.label}
              </span>
            </div>

            {/* 右矢印 */}
            <div className="text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
