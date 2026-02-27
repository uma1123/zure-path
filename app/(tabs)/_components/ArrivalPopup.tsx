"use client";

type Props = {
  show: boolean;
  destinationName: string;
  onArrive: () => void;
  onClose: () => void;
};

export default function ArrivalPopup({
  show,
  destinationName,
  onArrive,
  onClose,
}: Props) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 active:bg-gray-300"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="px-5 pt-6 pb-2">
          {/* 目的地アイコン */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                  fill="#ef4444"
                />
                <circle cx="12" cy="12" r="5" fill="white" />
              </svg>
            </div>
          </div>

          {/* 目的地名 */}
          <h2 className="text-center text-lg font-bold text-gray-900 mb-1">
            {destinationName}
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">到着しました</p>

          {/* 到着ボタン */}
          <button
            onClick={onArrive}
            className="w-full rounded-full bg-green-500 py-3.5 text-base font-bold text-white active:bg-green-600 transition-colors shadow-lg shadow-green-500/30"
          >
            到着！
          </button>
        </div>
      </div>
    </div>
  );
}
