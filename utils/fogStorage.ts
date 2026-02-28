import type { Feature, Polygon, MultiPolygon } from "geojson";

const FOG_KEY = "zeropath_fog_union";

/**
 * 霧マスク（歩いた範囲）のGeoJSONをlocalStorageに保存する。
 * 高頻度呼び出しを想定し、呼び出し側でデバウンスすること。
 */
export function saveFogUnion(feature: Feature<Polygon | MultiPolygon>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOG_KEY, JSON.stringify(feature));
  } catch (e) {
    console.error("霧マスクの保存に失敗しました:", e);
  }
}

/**
 * localStorageから霧マスクのGeoJSONを復元する。
 * データがない場合やパースに失敗した場合は null を返す。
 */
export function loadFogUnion(): Feature<Polygon | MultiPolygon> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FOG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Feature<Polygon | MultiPolygon>;
    // 最低限のバリデーション
    if (
      parsed?.type === "Feature" &&
      parsed?.geometry &&
      (parsed.geometry.type === "Polygon" ||
        parsed.geometry.type === "MultiPolygon")
    ) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error("霧マスクの読み込みに失敗しました:", e);
    return null;
  }
}

/**
 * 霧マスクデータをクリアする（デバッグ用途）。
 */
export function clearFogUnion(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FOG_KEY);
}
