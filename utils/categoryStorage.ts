import { FILTER_OPTIONS, getOsmTagsFromCategories } from "./category";

const STORAGE_KEY = "selectedCategories";

/**
 * 全カテゴリーの一覧を取得する
 */
export const getAllCategories = (): string[] => {
  return FILTER_OPTIONS.flatMap((section) => section.items);
};

/**
 * localStorageから選択済みカテゴリーを取得する
 * 未設定の場合は全カテゴリーを返す（初回は全選択状態）
 */
export const getSelectedCategories = (): string[] => {
  if (typeof window === "undefined") return getAllCategories();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // 有効なカテゴリーのみフィルタリング
      const allCats = getAllCategories();
      return parsed.filter((cat) => allCats.includes(cat));
    }
  } catch {
    // パースエラー時はデフォルト値を返す
  }

  return getAllCategories();
};

/**
 * 選択済みカテゴリーをlocalStorageに保存する
 */
export const saveSelectedCategories = (categories: string[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    console.error("カテゴリーの保存に失敗しました");
  }
};

/**
 * 選択済みカテゴリーからOSMタグ一覧を取得する
 */
export const getSelectedOsmTags = (): string[] => {
  const categories = getSelectedCategories();
  return getOsmTagsFromCategories(categories);
};
