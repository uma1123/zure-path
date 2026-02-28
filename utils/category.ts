// カテゴリの型定義
export type CategoryItem = {
  label: string;
  osmTags: string[]; // OSMのタグ (例: "amenity=cafe")
};

export type CategorySection = {
  label: string;
  items: string[]; // UI表示用の項目名リスト
};

// ==========================================
// 1. UI表示用のカテゴリー定義 (設定画面などで使用)
// ==========================================
export const FILTER_OPTIONS: CategorySection[] = [
  {
    label: "すべての飲食店",
    items: [
      "レストラン",
      "カフェ",
      "居酒屋・バー",
      "ラーメン・麺類",
      "ファーストフード",
      "パン屋",
      "スイーツ・菓子",
    ],
  },
  {
    label: "すべてのショッピング",
    items: [
      "本屋",
      "雑貨・ギフト",
      "花屋",
      "市場・マルシェ",
      "百貨店・モール",
      "文房具",
    ],
  },
  {
    label: "公園・自然（癒やし）",
    items: [
      "公園",
      "広場",
      "湧き水・泉",
      "巨木・シンボルツリー",
      "水辺・海岸",
      "山頂・丘",
    ],
  },
  {
    label: "観光・絶景（映えスポット）",
    items: [
      "展望台・ビュースポット",
      "灯台",
      "記念碑・モニュメント",
      "神社・寺・史跡",
      "城・城跡",
      "噴水",
      "美術館・博物館",
      "動物園・水族館",
    ],
  },
  {
    label: "エンタメ・その他",
    items: [
      "映画館",
      "劇場",
      "遊園地・テーマパーク",
      "図書館",
      "公衆浴場・銭湯",
    ],
  },
];

// ==========================================
// 2. 日本語カテゴリーからOSMタグへの変換マップ (APIで使用)
// ==========================================
export const CATEGORY_TO_OSM_TAGS: Record<string, string[]> = {
  // --- 飲食店 ---
  レストラン: ["amenity=restaurant"],
  カフェ: ["amenity=cafe"],
  "居酒屋・バー": ["amenity=pub", "amenity=bar", "amenity=biergarten"],
  "ラーメン・麺類": ["amenity=restaurant"],
  ファーストフード: ["amenity=fast_food"],
  パン屋: ["shop=bakery"],
  "スイーツ・菓子": ["shop=confectionery"],

  // --- ショッピング ---
  本屋: ["shop=books"],
  "雑貨・ギフト": ["shop=variety_store", "shop=gift", "shop=general"],
  花屋: ["shop=florist", "shop=garden_centre"],
  "市場・マルシェ": ["amenity=marketplace"],
  "百貨店・モール": ["shop=department_store", "shop=mall"],
  文房具: ["shop=stationery"],

  // --- 公園・自然 ---
  公園: ["leisure=park", "leisure=playground"],
  広場: ["leisure=common", "leisure=plaza", "leisure=pitch"],
  "湧き水・泉": ["natural=spring"],
  "巨木・シンボルツリー": ["natural=tree"],
  "水辺・海岸": [
    "natural=coastline",
    "natural=bay",
    "natural=water",
    "waterway=riverbank",
  ],
  "山頂・丘": ["natural=peak"],

  // --- 観光・絶景 ---
  "展望台・ビュースポット": ["tourism=viewpoint"],
  灯台: ["man_made=lighthouse", "man_made=beacon"],
  "記念碑・モニュメント": [
    "historic=monument",
    "historic=memorial",
    "historic=wayside_cross",
  ],
  "神社・寺・史跡": [
    "amenity=place_of_worship",
    "historic=wayside_shrine",
    "historic=archaeological_site",
  ],
  "城・城跡": ["historic=castle", "historic=ruins"],
  噴水: ["amenity=fountain"],
  "美術館・博物館": ["tourism=museum", "tourism=artwork"],
  "動物園・水族館": ["tourism=zoo", "tourism=aquarium"],

  // --- エンタメ・その他 ---
  映画館: ["amenity=cinema"],
  劇場: ["amenity=theatre"],
  "遊園地・テーマパーク": ["tourism=theme_park", "leisure=water_park"],
  図書館: ["amenity=library"],
  "公衆浴場・銭湯": ["amenity=public_bath", "amenity=spa"],
};

// ヘルパー関数: 選択された日本語カテゴリリストから、API検索用のOSMタグリスト(重複なし)を生成する
export const getOsmTagsFromCategories = (categories: string[]): string[] => {
  const tags = new Set<string>();
  categories.forEach((cat) => {
    const osmTags = CATEGORY_TO_OSM_TAGS[cat];
    if (osmTags) {
      osmTags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags);
};

// ==========================================
// 3. OSMタグからカテゴリ表示名＋画像パスを取得するマッピング
// ==========================================
type CategoryDisplay = {
  label: string;
  image: string;
};

const OSM_TAG_TO_DISPLAY: Record<string, CategoryDisplay> = {
  // --- 飲食店 ---
  "amenity=restaurant": {
    label: "レストラン",
    image: "/category-image/restaurant.webp",
  },
  "amenity=cafe": { label: "カフェ", image: "/category-image/cafe.webp" },
  "amenity=pub": {
    label: "居酒屋・バー",
    image: "/category-image/bar.webp",
  },
  "amenity=bar": { label: "バー", image: "/category-image/bar.webp" },
  "amenity=biergarten": {
    label: "ビアガーデン",
    image: "/category-image/bia-garden.webp",
  },
  "amenity=fast_food": {
    label: "ファーストフード",
    image: "/category-image/fastfood.webp",
  },
  "shop=bakery": { label: "パン屋", image: "/category-image/pan.webp" },
  "shop=confectionery": {
    label: "スイーツ",
    image: "/category-image/sweets.webp",
  },

  // --- ショッピング ---
  "shop=books": { label: "書店", image: "/category-image/book.webp" },
  "shop=variety_store": {
    label: "雑貨店",
    image: "/category-image/zakkaten.webp",
  },
  "shop=gift": { label: "ギフトショップ", image: "/category-image/gift.webp" },
  "shop=general": { label: "雑貨店", image: "/category-image/zakkaten.webp" },
  "shop=florist": { label: "花屋", image: "/category-image/flower.webp" },
  "shop=garden_centre": {
    label: "園芸店",
    image: "/category-image/engei.webp",
  },
  "amenity=marketplace": {
    label: "マルシェ",
    image: "/category-image/shop.webp",
  },
  "shop=department_store": {
    label: "百貨店",
    image: "/category-image/shop.webp",
  },
  "shop=mall": { label: "モール", image: "/category-image/shop.webp" },
  "shop=stationery": {
    label: "文房具店",
    image: "/category-image/bunbougu.webp",
  },

  // --- 公園・自然 ---
  "leisure=park": { label: "公園", image: "/category-image/park.webp" },
  "leisure=playground": { label: "公園", image: "/category-image/park.webp" },
  "leisure=common": { label: "広場", image: "/category-image/park.webp" },
  "leisure=plaza": { label: "広場", image: "/category-image/park.webp" },
  "natural=spring": { label: "湧き水", image: "/category-image/park.webp" },
  "natural=tree": {
    label: "シンボルツリー",
    image: "/category-image/park.webp",
  },
  "natural=coastline": { label: "海岸", image: "/category-image/kaigan.webp" },
  "natural=water": { label: "水辺", image: "/category-image/mizube.webp" },
  "natural=peak": { label: "山頂", image: "/category-image/santyou.webp" },

  // --- 観光・絶景 ---
  "tourism=viewpoint": {
    label: "展望台",
    image: "/category-image/tenboudai.webp",
  },
  "man_made=lighthouse": {
    label: "灯台",
    image: "/category-image/toudai.webp",
  },
  "historic=monument": {
    label: "モニュメント",
    image: "/category-image/travel.webp",
  },
  "historic=memorial": {
    label: "記念碑",
    image: "/category-image/kinenhi.webp",
  },
  "amenity=place_of_worship": {
    label: "神社・寺",
    image: "/category-image/zinja.webp",
  },
  "historic=castle": { label: "城", image: "/category-image/shiro.webp" },
  "historic=ruins": { label: "史跡", image: "/category-image/shiseki.webp" },
  "amenity=fountain": { label: "噴水", image: "/category-image/hunsui.webp" },
  "tourism=museum": {
    label: "博物館",
    image: "/category-image/hakubutukan.webp",
  },
  "tourism=artwork": { label: "アート", image: "/category-image/art.webp" },
  "tourism=zoo": { label: "動物園", image: "/category-image/zoo.webp" },
  "tourism=aquarium": {
    label: "水族館",
    image: "/category-image/suizokukan.webp",
  },

  // --- エンタメ ---
  "amenity=cinema": { label: "映画館", image: "/category-image/eigakan.webp" },
  "amenity=theatre": { label: "劇場", image: "/category-image/gekizyou.webp" },
  "tourism=theme_park": {
    label: "テーマパーク",
    image: "/category-image/te-mapa-ku.webp",
  },
  "amenity=library": { label: "図書館", image: "/category-image/book.webp" },
  "amenity=public_bath": {
    label: "銭湯",
    image: "/category-image/sentou.webp",
  },
  "amenity=spa": { label: "スパ", image: "/category-image/supa.webp" },
};

const DEFAULT_DISPLAY: CategoryDisplay = {
  label: "スポット",
  image: "/category-image/travel.webp",
};

/**
 * OSMタグ（例: "amenity=cafe"）からカテゴリ表示名と画像パスを取得する
 */
export const getCategoryDisplay = (osmTag: string): CategoryDisplay => {
  return OSM_TAG_TO_DISPLAY[osmTag] || DEFAULT_DISPLAY;
};

/**
 * カテゴリ名（OSMタグまたは日本語カテゴリ名）からカテゴリ画像パスを取得する
 * ブックマーク一覧などで使用
 */
export const getCategoryImageByName = (category: string): string => {
  // 1. OSMタグとして直接マッチ
  if (OSM_TAG_TO_DISPLAY[category]) {
    return OSM_TAG_TO_DISPLAY[category].image;
  }

  // 2. 日本語カテゴリ名 → OSMタグ → 画像
  const osmTags = CATEGORY_TO_OSM_TAGS[category];
  if (osmTags && osmTags.length > 0) {
    const display = OSM_TAG_TO_DISPLAY[osmTags[0]];
    if (display) return display.image;
  }

  // 3. デフォルト
  return DEFAULT_DISPLAY.image;
};

// ==========================================
// 4. OSMタグからピンアイコンカテゴリを判定するマッピング
// ==========================================

/** ピンアイコンのカテゴリ種別 */
export type PinCategory = "inshoku" | "shop" | "park" | "kankou" | "entame";

/** ピンの状態: 1=デフォルト, 2=行きたい, 3=行った, 4=発見 */
export type PinState = 1 | 2 | 3 | 4;

// CATEGORY_TO_OSM_TAGS のジャンル分けに基づく逆引きマップ
const OSM_TAG_TO_PIN_CATEGORY: Record<string, PinCategory> = {};

// --- 飲食店 ---
const INSHOKU_CATEGORIES = [
  "レストラン",
  "カフェ",
  "居酒屋・バー",
  "ラーメン・麺類",
  "ファーストフード",
  "パン屋",
  "スイーツ・菓子",
];
// --- ショッピング ---
const SHOP_CATEGORIES = [
  "本屋",
  "雑貨・ギフト",
  "花屋",
  "市場・マルシェ",
  "百貨店・モール",
  "文房具",
];
// --- 公園・自然 ---
const PARK_CATEGORIES = [
  "公園",
  "広場",
  "湧き水・泉",
  "巨木・シンボルツリー",
  "水辺・海岸",
  "山頂・丘",
];
// --- 観光・絶景 ---
const KANKOU_CATEGORIES = [
  "展望台・ビュースポット",
  "灯台",
  "記念碑・モニュメント",
  "神社・寺・史跡",
  "城・城跡",
  "噴水",
  "美術館・博物館",
  "動物園・水族館",
];
// --- エンタメ・その他 ---
const ENTAME_CATEGORIES = [
  "映画館",
  "劇場",
  "遊園地・テーマパーク",
  "図書館",
  "公衆浴場・銭湯",
];

// カテゴリリストからOSMタグ→ピンカテゴリの逆引きマップを構築
function buildPinCategoryMap(
  categories: string[],
  pinCategory: PinCategory,
): void {
  categories.forEach((cat) => {
    const tags = CATEGORY_TO_OSM_TAGS[cat];
    if (tags) {
      tags.forEach((tag) => {
        OSM_TAG_TO_PIN_CATEGORY[tag] = pinCategory;
      });
    }
  });
}

buildPinCategoryMap(INSHOKU_CATEGORIES, "inshoku");
buildPinCategoryMap(SHOP_CATEGORIES, "shop");
buildPinCategoryMap(PARK_CATEGORIES, "park");
buildPinCategoryMap(KANKOU_CATEGORIES, "kankou");
buildPinCategoryMap(ENTAME_CATEGORIES, "entame");

// 日本語カテゴリ名 → ピンカテゴリの逆引きマップ
const CATEGORY_NAME_TO_PIN: Record<string, PinCategory> = {};

function buildCategoryNameMap(
  categories: string[],
  pinCategory: PinCategory,
): void {
  categories.forEach((cat) => {
    CATEGORY_NAME_TO_PIN[cat] = pinCategory;
  });
}

buildCategoryNameMap(INSHOKU_CATEGORIES, "inshoku");
buildCategoryNameMap(SHOP_CATEGORIES, "shop");
buildCategoryNameMap(PARK_CATEGORIES, "park");
buildCategoryNameMap(KANKOU_CATEGORIES, "kankou");
buildCategoryNameMap(ENTAME_CATEGORIES, "entame");

/**
 * OSMタグ（例: "amenity=cafe"）からピンアイコンのカテゴリを取得する
 */
export const getPinCategory = (osmTag: string): PinCategory => {
  return OSM_TAG_TO_PIN_CATEGORY[osmTag] || "kankou";
};

/**
 * OSMタグとピン状態からアイコンパスを取得する
 * @param osmTag - OSMタグ（例: "amenity=cafe"）
 * @param state - 1=デフォルト, 2=行きたい, 3=行った, 4=発見
 * @returns アイコンパス（例: "/icon/inshoku_1.webp"）
 */
export const getPinIconPath = (osmTag: string, state: PinState = 1): string => {
  const category = getPinCategory(osmTag);
  return `/icon/${category}_${state}.webp`;
};

/**
 * 日本語カテゴリ名（例: "カフェ"）からピンカテゴリを取得する
 * DiscoverPopupで選択されたジャンル名からピンアイコンを決定するために使用
 */
export const getCategoryNamePinCategory = (
  categoryName: string,
): PinCategory => {
  return CATEGORY_NAME_TO_PIN[categoryName] || "kankou";
};

/**
 * 日本語カテゴリ名から発見ピン（_4）のアイコンパスを取得する
 * @param categoryName - 日本語カテゴリ名（例: "カフェ"）
 * @returns アイコンパス（例: "/icon/inshoku_4.webp"）
 */
export const getDiscoverPinIconPath = (categoryName: string): string => {
  const pinCategory = getCategoryNamePinCategory(categoryName);
  return `/icon/${pinCategory}_4.webp`;
};
