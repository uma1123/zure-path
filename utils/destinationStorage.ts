export type SavedDestination = {
  name: string;
  lat: number;
  lng: number;
};

const DEST_KEY = "zeropath_main_destination";

export function saveDestination(dest: SavedDestination): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEST_KEY, JSON.stringify(dest));
  } catch {
    // 保存失敗は無視
  }
}

export function loadDestination(): SavedDestination | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDestination;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDestination(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEST_KEY);
}
