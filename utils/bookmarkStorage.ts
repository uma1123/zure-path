import type { Place } from "../app/(tabs)/_components/types";

export type PlaceRecord = {
  id: string;
  name: string;
  date: string; // "2月3日" など（表示用）
  rawDate: string; // "2026-02-26"（ソート用）
  category: string;
  time?: string;
  distance?: string; // "300m", "2.3km"
  rating?: number;
  comment?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
};

const VISITED_KEY = "zeropath_visited";
const WANTED_KEY = "zeropath_wanted";
const DISCOVERED_KEY = "zeropath_discovered";

// --------------------------------------------------
// 内部ヘルパー
// --------------------------------------------------
function formatDateParts(date: Date): { date: string; rawDate: string } {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return {
    date: `${month}月${day}日`,
    rawDate: date.toISOString().split("T")[0],
  };
}

function metersToString(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

function load(key: string): PlaceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as PlaceRecord[];
  } catch {
    return [];
  }
}

function persist(key: string, records: PlaceRecord[]): void {
  localStorage.setItem(key, JSON.stringify(records));
}

// --------------------------------------------------
// 公開API
// --------------------------------------------------

/** 「行った」として保存（評価・メモ・写真付き） */
export function saveVisited(
  place: Place,
  rating?: number,
  comment?: string,
  imageUrl?: string,
): void {
  const records = load(VISITED_KEY);
  const { date, rawDate } = formatDateParts(new Date());
  records.unshift({
    id: `v-${Date.now()}`,
    name: place.name,
    date,
    rawDate,
    category: place.category ?? "",
    distance: metersToString(place.distance),
    rating,
    comment: comment || undefined,
    imageUrl: imageUrl || undefined,
  });
  persist(VISITED_KEY, records);
}

/** 「行きたい」として保存（同名スポットが既にある場合はスキップ） */
export function saveWanted(place: Place): void {
  const records = load(WANTED_KEY);
  if (records.some((r) => r.name === place.name)) return;
  const { date, rawDate } = formatDateParts(new Date());
  records.unshift({
    id: `w-${Date.now()}`,
    name: place.name,
    date: `登録日: ${date}`,
    rawDate,
    category: place.category ?? "",
    distance: metersToString(place.distance),
  });
  persist(WANTED_KEY, records);
}

/** 「発見した」として保存（自由入力スポット） */
export function saveDiscovered(
  name: string,
  category: string,
  comment?: string,
  imageUrl?: string,
  lat?: number,
  lng?: number,
): void {
  const records = load(DISCOVERED_KEY);
  const { date, rawDate } = formatDateParts(new Date());
  records.unshift({
    id: `d-${Date.now()}`,
    name,
    date: `発見日: ${date}`,
    rawDate,
    category: category || "スポット",
    comment: comment || undefined,
    imageUrl: imageUrl || undefined,
    lat,
    lng,
  });
  persist(DISCOVERED_KEY, records);
}

/** 行ったリストを取得 */
export function getVisited(): PlaceRecord[] {
  return load(VISITED_KEY);
}

/** 行きたいリストを取得 */
export function getWanted(): PlaceRecord[] {
  return load(WANTED_KEY);
}

/** 発見リストを取得 */
export function getDiscovered(): PlaceRecord[] {
  return load(DISCOVERED_KEY);
}

/** 指定スポットが「行きたい」に登録済みかチェック */
export function isWanted(placeName: string): boolean {
  return load(WANTED_KEY).some((r) => r.name === placeName);
}

/** 指定スポットが「行った」に登録済みかチェック */
export function isVisited(placeName: string): boolean {
  return load(VISITED_KEY).some((r) => r.name === placeName);
}
