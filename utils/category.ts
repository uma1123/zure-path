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
    image: "/category-image/restaurant.jpg",
  },
  "amenity=cafe": { label: "カフェ", image: "/category-image/cafe.jpg" },
  "amenity=pub": {
    label: "居酒屋・バー",
    image: "/category-image/bar.jpg",
  },
  "amenity=bar": { label: "バー", image: "/category-image/bar.jpg" },
  "amenity=biergarten": {
    label: "ビアガーデン",
    image: "/category-image/bia-garden.jpg",
  },
  "amenity=fast_food": {
    label: "ファーストフード",
    image: "/category-image/fastfood.jpg",
  },
  "shop=bakery": { label: "パン屋", image: "/category-image/pan.jpg" },
  "shop=confectionery": {
    label: "スイーツ",
    image: "/category-image/sweets.jpg",
  },

  // --- ショッピング ---
  "shop=books": { label: "書店", image: "/category-image/book.jpg" },
  "shop=variety_store": {
    label: "雑貨店",
    image: "/category-image/zakkaten.jpg",
  },
  "shop=gift": { label: "ギフトショップ", image: "/category-image/gift.jpg" },
  "shop=general": { label: "雑貨店", image: "/category-image/zakkaten.jpg" },
  "shop=florist": { label: "花屋", image: "/category-image/flower.jpg" },
  "shop=garden_centre": { label: "園芸店", image: "/category-image/engei.jpg" },
  "amenity=marketplace": {
    label: "マルシェ",
    image: "/category-image/shop.jpg",
  },
  "shop=department_store": {
    label: "百貨店",
    image: "/category-image/shop.jpg",
  },
  "shop=mall": { label: "モール", image: "/category-image/shop.jpg" },
  "shop=stationery": {
    label: "文房具店",
    image: "/category-image/bunbougu.jpg",
  },

  // --- 公園・自然 ---
  "leisure=park": { label: "公園", image: "/category-image/park.jpg" },
  "leisure=playground": { label: "公園", image: "/category-image/park.jpg" },
  "leisure=common": { label: "広場", image: "/category-image/park.jpg" },
  "leisure=plaza": { label: "広場", image: "/category-image/park.jpg" },
  "natural=spring": { label: "湧き水", image: "/category-image/park.jpg" },
  "natural=tree": {
    label: "シンボルツリー",
    image: "/category-image/park.jpg",
  },
  "natural=coastline": { label: "海岸", image: "/category-image/kaigan.jpg" },
  "natural=water": { label: "水辺", image: "/category-image/mizube.jpg" },
  "natural=peak": { label: "山頂", image: "/category-image/santyou.jpg" },

  // --- 観光・絶景 ---
  "tourism=viewpoint": {
    label: "展望台",
    image: "/category-image/tenboudai.jpg",
  },
  "man_made=lighthouse": { label: "灯台", image: "/category-image/toudai.jpg" },
  "historic=monument": {
    label: "モニュメント",
    image: "/category-image/travel.jpg",
  },
  "historic=memorial": {
    label: "記念碑",
    image: "/category-image/kinenhi.jpg",
  },
  "amenity=place_of_worship": {
    label: "神社・寺",
    image: "/category-image/zinja.jpg",
  },
  "historic=castle": { label: "城", image: "/category-image/shiro.jpg" },
  "historic=ruins": { label: "史跡", image: "/category-image/shiseki.jpg" },
  "amenity=fountain": { label: "噴水", image: "/category-image/hunsui.jpg" },
  "tourism=museum": {
    label: "博物館",
    image: "/category-image/hakubutukan.jpg",
  },
  "tourism=artwork": { label: "アート", image: "/category-image/art.jpg" },
  "tourism=zoo": { label: "動物園", image: "/category-image/zoo.jpg" },
  "tourism=aquarium": {
    label: "水族館",
    image: "/category-image/suizokukan.jpg",
  },

  // --- エンタメ ---
  "amenity=cinema": { label: "映画館", image: "/category-image/eigakan.jpg" },
  "amenity=theatre": { label: "劇場", image: "/category-image/gekizyou.jpg" },
  "tourism=theme_park": {
    label: "テーマパーク",
    image: "/category-image/te-mapa-ku.jpg",
  },
  "amenity=library": { label: "図書館", image: "/category-image/book.jpg" },
  "amenity=public_bath": { label: "銭湯", image: "/category-image/sentou.jpg" },
  "amenity=spa": { label: "スパ", image: "/category-image/supa.jpg" },
};

const DEFAULT_DISPLAY: CategoryDisplay = {
  label: "スポット",
  image: "/category-image/travel.jpg",
};

/**
 * OSMタグ（例: "amenity=cafe"）からカテゴリ表示名と画像パスを取得する
 */
export const getCategoryDisplay = (osmTag: string): CategoryDisplay => {
  return OSM_TAG_TO_DISPLAY[osmTag] || DEFAULT_DISPLAY;
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
 * @returns アイコンパス（例: "/icon/inshoku_1.svg"）
 */
export const getPinIconPath = (osmTag: string, state: PinState = 1): string => {
  const category = getPinCategory(osmTag);
  return `/icon/${category}_${state}.svg`;
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
 * @returns アイコンパス（例: "/icon/inshoku_4.svg"）
 */
export const getDiscoverPinIconPath = (categoryName: string): string => {
  const pinCategory = getCategoryNamePinCategory(categoryName);
  return `/icon/${pinCategory}_4.svg`;
};
