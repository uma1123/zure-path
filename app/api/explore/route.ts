import { NextResponse } from "next/server";

// 距離の単位を管理する列挙型を定義
enum DistanceUnit {
  METERS = "meters",
  KILOMETERS = "kilometers",
}

// OpenStreetMapの応答データを安全に扱うための型を定義
interface OSMTags {
  // JavaScriptの変数名として無効な名称を柔軟に受け入れるための定義
  [key: string]: string | undefined;
}

interface OSMElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: OSMTags;
}

interface OSMResponse {
  elements: OSMElement[];
}

// 方角を管理する列挙型を定義（真北を0度として時計回り）
enum Direction {
  NORTH = 0,
  NORTHEAST = 45,
  EAST = 90,
  SOUTHEAST = 135,
  SOUTH = 180,
  SOUTHWEST = 225,
  WEST = 270,
  NORTHWEST = 315,
}

// 現在地から店舗への方位角（0〜360度）を計算する関数
// φ1,λ1: 現在地の緯度・経度、φ2,λ2: 店舗の緯度・経度
function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  // 度数法からラジアンへ変換
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  // atan2の結果（-π〜π）を0〜360度に変換
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// 店舗の方位角が、指定した方角を中心とした扇形の範囲内にあるかを判定する関数
function isWithinDirectionRange(
  bearing: number,
  targetDirection: number,
  halfAngle: number,
): boolean {
  // 角度差を-180〜180の範囲に正規化して比較する
  let diff = bearing - targetDirection;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return Math.abs(diff) <= halfAngle;
}

export async function POST(request: Request) {
  try {
    // 画面側から送信された情報を受け取る
    const body = await request.json();
    const lat = Number(body.currentLat);
    const lng = Number(body.currentLng);
    const radius = Number(body.radius) || 1000;
    const placeType = String(body.placeType);

    // 方角フィルタリングのパラメータ（任意）
    // direction: 方角の名前（"north", "east"等）または角度（0〜360）
    // directionRange: 方角の許容範囲（片側の角度、デフォルト45度 → 合計90度の扇形）
    const directionInput = body.direction ?? null;
    const directionRange = Number(body.directionRange) || 45;

    // 方角パラメータを角度（数値）に変換する
    let targetDirection: number | null = null;
    if (directionInput !== null) {
      const directionMap: Record<string, number> = {
        north: Direction.NORTH,
        northeast: Direction.NORTHEAST,
        east: Direction.EAST,
        southeast: Direction.SOUTHEAST,
        south: Direction.SOUTH,
        southwest: Direction.SOUTHWEST,
        west: Direction.WEST,
        northwest: Direction.NORTHWEST,
      };
      if (
        typeof directionInput === "string" &&
        directionInput.toLowerCase() in directionMap
      ) {
        targetDirection = directionMap[directionInput.toLowerCase()];
      } else {
        targetDirection = Number(directionInput);
        if (isNaN(targetDirection)) targetDirection = null;
      }
    }

    // 検索条件に応じたOverpass QLの命令文を動的に構築
    const query = `
      [out:json][timeout:20];
      (
        node["leisure"="${placeType}"](around:${radius}, ${lat}, ${lng});
        node["amenity"="${placeType}"](around:${radius}, ${lat}, ${lng});
      );
      out body;
      >;
      out skel qt;
    `;

    // 複数のOverpass APIサーバーを用意し、接続に失敗した場合は次のサーバーを試す
    const overpassServers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const serverUrl of overpassServers) {
      try {
        // 無限待機を防ぐため、15秒で通信を強制切断する
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        console.log(`Overpass APIサーバーに接続中: ${serverUrl}`);
        response = await fetch(serverUrl, {
          method: "POST",
          body: "data=" + encodeURIComponent(query),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "CityExplorationHackathonApp/1.0",
          },
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`接続成功: ${serverUrl}`);
          break; // 成功したらループを抜ける
        }
      } catch (err: any) {
        console.log(`サーバー ${serverUrl} への接続失敗: ${err.message}`);
        lastError = err;
        response = null;
        continue; // 次のサーバーを試す
      }
    }

    if (!response) {
      throw (
        lastError ||
        new Error("全てのOverpass APIサーバーへの接続に失敗しました")
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `外部システムからの応答異常: 状態コード ${response.status}, 内容: ${errorText}`,
      );
    }

    // 取得したデータを事前に定義した型に当てはめる
    const data: OSMResponse = await response.json();

    // 画面側で扱いやすいようにデータを整形
    let formattedPlaces = data.elements
      .filter((element) => element.tags && element.tags.name) // 名前が登録されている場所のみを抽出
      .map((element) => {
        const placeLat = element.lat;
        const placeLng = element.lon;
        const bearing = calculateBearing(lat, lng, placeLat, placeLng);
        return {
          name: element.tags?.name || "名称不明",
          lat: placeLat,
          lng: placeLng,
          bearing: Math.round(bearing * 10) / 10, // 方位角（小数点1桁）
        };
      });

    // 方角が指定されている場合、扇形の範囲でフィルタリングする
    if (targetDirection !== null) {
      formattedPlaces = formattedPlaces.filter((place) =>
        isWithinDirectionRange(place.bearing, targetDirection!, directionRange),
      );
    }

    // 最大5件に制限して返却
    formattedPlaces = formattedPlaces.slice(0, 5);

    return NextResponse.json({
      status: "success",
      direction:
        targetDirection !== null
          ? { angle: targetDirection, range: directionRange }
          : null,
      places: formattedPlaces,
    });
  } catch (error: any) {
    console.error("通信エラーの詳細:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "通信処理で問題が発生しました",
        detail: error.message || "不明なエラー",
      },
      { status: 500 },
    );
  }
}
