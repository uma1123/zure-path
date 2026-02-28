// 経路履歴のモックデータ

export type PathPoint = {
  lat: number;
  lng: number;
};

export type RoutePlaceStatus = "visited" | "wanted" | "discovered";

export type RoutePlace = {
  id: string;
  name: string;
  category: string;
  hours?: string; // 営業時間
  distance?: string; // "300m" など
  rating?: number; // 1-5
  comment?: string;
  imageUrl?: string;
  status: RoutePlaceStatus;
};

export type RouteRecord = {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "18:45" など
  startName: string;
  endName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceKm: number;
  durationMin: number;
  pathPoints: PathPoint[];
  places: RoutePlace[];
};

// ========================================
// モックデータ（東京近辺の散歩経路）
// ========================================
const MOCK_ROUTES: RouteRecord[] = [
  {
    id: "r-001",
    date: "2026-02-25",
    startTime: "14:30",
    startName: "渋谷駅",
    endName: "代々木公園",
    startLat: 35.6581,
    startLng: 139.7014,
    endLat: 35.6715,
    endLng: 139.6947,
    distanceKm: 1.8,
    durationMin: 25,
    pathPoints: [
      { lat: 35.6581, lng: 139.7014 },
      { lat: 35.6595, lng: 139.7005 },
      { lat: 35.6615, lng: 139.6998 },
      { lat: 35.664, lng: 139.6985 },
      { lat: 35.666, lng: 139.697 },
      { lat: 35.6685, lng: 139.696 },
      { lat: 35.67, lng: 139.6952 },
      { lat: 35.6715, lng: 139.6947 },
    ],
    places: [
      {
        id: "p-001",
        name: "FUGLEN TOKYO",
        category: "カフェ",
        hours: "8:00-22:00",
        distance: "300m",
        rating: 5,
        comment: "北欧風のおしゃれなカフェ。コーヒーが絶品だった",
        status: "visited",
      },
      {
        id: "p-002",
        name: "代々木公園 噴水広場",
        category: "公園",
        hours: "24時間",
        distance: "1.2km",
        rating: 4,
        comment: "広くて気持ちいい。ピクニックしたい",
        status: "visited",
      },
      {
        id: "p-003",
        name: "渋谷古書センター",
        category: "雑貨店",
        distance: "150m",
        status: "discovered",
        comment: "偶然見つけた。今度ゆっくり来たい",
      },
    ],
  },
  {
    id: "r-002",
    date: "2026-02-25",
    startTime: "17:00",
    startName: "新宿御苑",
    endName: "明治神宮外苑",
    startLat: 35.6852,
    startLng: 139.71,
    endLat: 35.6745,
    endLng: 139.7177,
    distanceKm: 1.5,
    durationMin: 20,
    pathPoints: [
      { lat: 35.6852, lng: 139.71 },
      { lat: 35.6835, lng: 139.7115 },
      { lat: 35.6815, lng: 139.713 },
      { lat: 35.6795, lng: 139.7145 },
      { lat: 35.6775, lng: 139.7158 },
      { lat: 35.676, lng: 139.7168 },
      { lat: 35.6745, lng: 139.7177 },
    ],
    places: [
      {
        id: "p-004",
        name: "新宿御苑 大温室",
        category: "公園",
        hours: "9:00-16:00",
        distance: "200m",
        rating: 4,
        comment: "熱帯植物がすごい。冬でも暖かくて良い",
        status: "visited",
      },
      {
        id: "p-005",
        name: "カフェ・ド・フロール",
        category: "カフェ",
        hours: "10:00-20:00",
        distance: "800m",
        status: "wanted",
      },
    ],
  },
  {
    id: "r-003",
    date: "2026-02-22",
    startTime: "10:15",
    startName: "東京駅",
    endName: "皇居外苑",
    startLat: 35.6812,
    startLng: 139.7671,
    endLat: 35.6825,
    endLng: 139.754,
    distanceKm: 1.2,
    durationMin: 18,
    pathPoints: [
      { lat: 35.6812, lng: 139.7671 },
      { lat: 35.6815, lng: 139.7645 },
      { lat: 35.6818, lng: 139.762 },
      { lat: 35.682, lng: 139.7595 },
      { lat: 35.6822, lng: 139.757 },
      { lat: 35.6825, lng: 139.754 },
    ],
    places: [
      {
        id: "p-006",
        name: "和田倉噴水公園",
        category: "公園",
        hours: "24時間",
        distance: "500m",
        rating: 4,
        comment: "噴水が綺麗で癒された",
        status: "visited",
      },
      {
        id: "p-007",
        name: "二重橋",
        category: "史跡",
        distance: "800m",
        rating: 5,
        comment: "歴史を感じる場所。写真スポットとしても最高",
        status: "visited",
      },
      {
        id: "p-008",
        name: "丸の内仲通りのパン屋",
        category: "パン",
        hours: "7:00-19:00",
        distance: "200m",
        status: "discovered",
        comment: "通りすがりに見つけた。クロワッサンが美味しそう",
      },
    ],
  },
  {
    id: "r-004",
    date: "2026-02-18",
    startTime: "15:00",
    startName: "上野駅",
    endName: "不忍池",
    startLat: 35.7141,
    startLng: 139.7774,
    endLat: 35.7126,
    endLng: 139.77,
    distanceKm: 0.9,
    durationMin: 12,
    pathPoints: [
      { lat: 35.7141, lng: 139.7774 },
      { lat: 35.7138, lng: 139.7755 },
      { lat: 35.7135, lng: 139.7735 },
      { lat: 35.713, lng: 139.7718 },
      { lat: 35.7126, lng: 139.77 },
    ],
    places: [
      {
        id: "p-009",
        name: "上野恩賜公園",
        category: "公園",
        hours: "5:00-23:00",
        distance: "100m",
        rating: 4,
        status: "visited",
      },
      {
        id: "p-010",
        name: "不忍池 弁天堂",
        category: "神社",
        distance: "600m",
        rating: 3,
        comment: "蓮の時期にまた来たい",
        status: "wanted",
      },
    ],
  },
  {
    id: "r-005",
    date: "2026-02-10",
    startTime: "11:00",
    startName: "浅草寺",
    endName: "スカイツリー",
    startLat: 35.7148,
    startLng: 139.7967,
    endLat: 35.7101,
    endLng: 139.8107,
    distanceKm: 2.1,
    durationMin: 30,
    pathPoints: [
      { lat: 35.7148, lng: 139.7967 },
      { lat: 35.714, lng: 139.799 },
      { lat: 35.7132, lng: 139.8015 },
      { lat: 35.7125, lng: 139.804 },
      { lat: 35.7118, lng: 139.806 },
      { lat: 35.7112, lng: 139.808 },
      { lat: 35.7105, lng: 139.8095 },
      { lat: 35.7101, lng: 139.8107 },
    ],
    places: [
      {
        id: "p-011",
        name: "浅草メンチ",
        category: "ファストフード",
        hours: "10:00-19:00",
        distance: "50m",
        rating: 5,
        comment: "揚げたてメンチカツが最高！行列だけど並ぶ価値あり",
        status: "visited",
      },
      {
        id: "p-012",
        name: "隅田公園",
        category: "公園",
        hours: "24時間",
        distance: "800m",
        rating: 4,
        comment: "スカイツリーが綺麗に見える",
        status: "visited",
      },
      {
        id: "p-013",
        name: "押上の猫カフェ",
        category: "カフェ",
        hours: "11:00-20:00",
        distance: "1.8km",
        status: "discovered",
        comment: "看板が可愛くて気になった",
      },
    ],
  },
  {
    id: "r-006",
    date: "2026-01-28",
    startTime: "13:20",
    startName: "吉祥寺駅",
    endName: "井の頭公園",
    startLat: 35.7032,
    startLng: 139.5794,
    endLat: 35.699,
    endLng: 139.572,
    distanceKm: 0.8,
    durationMin: 10,
    pathPoints: [
      { lat: 35.7032, lng: 139.5794 },
      { lat: 35.702, lng: 139.577 },
      { lat: 35.701, lng: 139.575 },
      { lat: 35.7, lng: 139.5735 },
      { lat: 35.699, lng: 139.572 },
    ],
    places: [
      {
        id: "p-014",
        name: "井の頭自然文化園",
        category: "動物園",
        hours: "9:30-17:00",
        distance: "400m",
        rating: 4,
        comment: "リスの小径が楽しかった",
        status: "visited",
      },
      {
        id: "p-015",
        name: "いせや公園店",
        category: "ファストフード",
        hours: "12:00-21:00",
        distance: "100m",
        rating: 5,
        comment: "焼き鳥が安くて美味しい！名物店",
        status: "visited",
      },
    ],
  },
];

// ========================================
// localStorage 永続化（実データ保存用）
// ========================================
const SAVED_ROUTES_KEY = "zeropath_saved_routes";

function loadSavedRoutes(): RouteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(SAVED_ROUTES_KEY) || "[]",
    ) as RouteRecord[];
  } catch {
    return [];
  }
}

function persistSavedRoutes(routes: RouteRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(routes));
}

/** 新しい経路を保存（localStorageに永続化） */
export function addRoute(route: RouteRecord): void {
  const saved = loadSavedRoutes();
  saved.unshift(route);
  persistSavedRoutes(saved);
}

/** モック + 保存済みを統合して全経路を取得 */
function getAllCombinedRoutes(): RouteRecord[] {
  return [...loadSavedRoutes(), ...MOCK_ROUTES];
}

/** 指定日付の経路一覧を取得 */
export function getRoutesByDate(date: string): RouteRecord[] {
  return getAllCombinedRoutes().filter((r) => r.date === date);
}

/** 経路が存在する日付一覧を取得 (重複なし) */
export function getDatesWithRoutes(): string[] {
  return [...new Set(getAllCombinedRoutes().map((r) => r.date))];
}

/** 全経路を取得 */
export function getAllRoutes(): RouteRecord[] {
  return getAllCombinedRoutes();
}
