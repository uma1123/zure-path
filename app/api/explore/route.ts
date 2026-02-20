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

export async function POST(request: Request) {
  try {
    // 画面側から送信された情報を受け取る
    const body = await request.json();
    const lat = Number(body.currentLat);
    const lng = Number(body.currentLng);
    const radius = Number(body.radius) || 1000;
    const placeType = String(body.placeType);

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
    const formattedPlaces = data.elements
      .filter((element) => element.tags && element.tags.name) // 名前が登録されている場所のみを抽出
      .map((element) => ({
        name: element.tags?.name || "名称不明",
        lat: element.lat,
        lng: element.lon,
      }))
      .slice(0, 5); // 最大5件に制限して返却

    return NextResponse.json({
      status: "success",
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
