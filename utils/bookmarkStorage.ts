import type { Place } from "../app/(tabs)/_components/types";

const visitedNames = new Set<string>();
const wantedNames = new Set<string>();

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

// --------------------------------------------------
// 公開API
// --------------------------------------------------

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
  // DB に保存（失敗しても画面側はそのまま）
  if (typeof window !== "undefined") {
    visitedNames.add(place.name);
    void fetch("/api/bookmarks/visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: place.name,
        category: place.category ?? "",
        distanceMeters: place.distance,
        rating,
        comment,
        imageUrl,
      }),
    }).catch(() => {
      // サイレントに失敗
    });
  }
}

/** 「行きたい」として保存（同名スポットが既にある場合はスキップ） */
export function saveWanted(place: Place): void {
  // DB に保存（失敗しても画面側はそのまま）
  if (typeof window !== "undefined") {
    wantedNames.add(place.name);
    void fetch("/api/bookmarks/wanted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: place.name,
        category: place.category ?? "",
        distanceMeters: place.distance,
      }),
    }).catch(() => {
      // サイレントに失敗
    });
  }
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
  if (typeof window !== "undefined") {
    void fetch("/api/bookmarks/discovered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        comment,
        imageUrl,
        lat,
        lng,
      }),
    }).catch(() => {
      // サイレントに失敗
    });
  }
}

/** 行ったリストを取得 */
export async function getVisited(): Promise<PlaceRecord[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/bookmarks/visited");
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      console.error("getVisited failed:", data.detail || data.message);
      return [];
    }
    const rows = (data.rows as any[]) ?? [];

    visitedNames.clear();

    return rows.map((row) => {
      const createdAt = row.created_at
        ? new Date(row.created_at)
        : new Date();
      const rawDate = createdAt.toISOString().split("T")[0];
      const [year, month, day] = rawDate.split("-").map((x: string) =>
        Number(x),
      );
      const name = row.name as string;
      visitedNames.add(name);

      return {
        id: String(row.id),
        name,
        date: `${month}月${day}日`,
        rawDate,
        category: (row.category as string) ?? "",
        distance:
          typeof row.distance_m === "number"
            ? row.distance_m >= 1000
              ? `${(row.distance_m / 1000).toFixed(1)}km`
              : `${Math.round(row.distance_m)}m`
            : undefined,
        rating: row.rating ?? undefined,
        comment: row.comment ?? undefined,
        imageUrl: row.image_url ?? undefined,
      } satisfies PlaceRecord;
    });
  } catch (e) {
    console.error("getVisited unexpected error:", e);
    return [];
  }
}

/** 行きたいリストを取得 */
export async function getWanted(): Promise<PlaceRecord[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/bookmarks/wanted");
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      console.error("getWanted failed:", data.detail || data.message);
      return [];
    }
    const rows = (data.rows as any[]) ?? [];

    wantedNames.clear();

    return rows.map((row) => {
      const createdAt = row.created_at
        ? new Date(row.created_at)
        : new Date();
      const rawDate = createdAt.toISOString().split("T")[0];
      const [year, month, day] = rawDate.split("-").map((x: string) =>
        Number(x),
      );
      const name = row.name as string;
      wantedNames.add(name);

      return {
        id: String(row.id),
        name,
        date: `登録日: ${month}月${day}日`,
        rawDate,
        category: (row.category as string) ?? "",
        distance:
          typeof row.distance_m === "number"
            ? row.distance_m >= 1000
              ? `${(row.distance_m / 1000).toFixed(1).toString()}km`
              : `${Math.round(row.distance_m)}m`
            : undefined,
      } satisfies PlaceRecord;
    });
  } catch (e) {
    console.error("getWanted unexpected error:", e);
    return [];
  }
}

/** 発見リストを取得 */
export async function getDiscovered(): Promise<PlaceRecord[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/bookmarks/discovered");
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      console.error("getDiscovered failed:", data.detail || data.message);
      return [];
    }
    const rows = (data.rows as any[]) ?? [];

    return rows.map((row) => {
      const createdAt = row.discovered_at
        ? new Date(row.discovered_at)
        : row.created_at
          ? new Date(row.created_at)
          : new Date();
      const rawDate = createdAt.toISOString().split("T")[0];
      const [year, month, day] = rawDate.split("-").map((x: string) =>
        Number(x),
      );

      return {
        id: String(row.id),
        name: row.name as string,
        date: `発見日: ${month}月${day}日`,
        rawDate,
        category: (row.category as string) ?? "スポット",
        comment: row.comment ?? undefined,
        imageUrl: row.image_url ?? undefined,
        lat:
          typeof row.lat === "number" && Number.isFinite(row.lat)
            ? row.lat
            : undefined,
        lng:
          typeof row.lng === "number" && Number.isFinite(row.lng)
            ? row.lng
            : undefined,
      } satisfies PlaceRecord;
    });
  } catch (e) {
    console.error("getDiscovered unexpected error:", e);
    return [];
  }
}

/** 指定スポットが「行きたい」に登録済みかチェック */
export function isWanted(placeName: string): boolean {
  return wantedNames.has(placeName);
}

/** 指定スポットが「行った」に登録済みかチェック */
export function isVisited(placeName: string): boolean {
  return visitedNames.has(placeName);
}
