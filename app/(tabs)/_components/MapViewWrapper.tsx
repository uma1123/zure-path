"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        <p className="text-sm font-medium text-gray-500">読み込み中...</p>
      </div>
    </div>
  ),
});

export default function MapViewWrapper() {
  return <MapView />;
}
