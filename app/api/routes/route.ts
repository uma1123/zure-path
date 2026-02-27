import { NextResponse } from "next/server";

type OsrmRouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

type OsrmRouteResponse = {
  routes: {
    geometry: OsrmRouteGeometry;
    distance: number;
    duration: number;
  }[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      startLat: number;
      startLng: number;
      destLat: number;
      destLng: number;
    };

    const { startLat, startLng, destLat, destLng } = body || {};

    if (
      typeof startLat !== "number" ||
      typeof startLng !== "number" ||
      typeof destLat !== "number" ||
      typeof destLng !== "number"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "不正なリクエストです",
          detail: "start/dest 座標が不足しています",
        },
        { status: 400 },
      );
    }

    // OSRM から経路情報を取得（表示用）
    const osrmUrl = new URL(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}`,
    );
    osrmUrl.searchParams.set("overview", "full");
    osrmUrl.searchParams.set("geometries", "geojson");

    const osrmRes = await fetch(osrmUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!osrmRes.ok) {
      console.error(
        "[/api/routes] OSRM error status:",
        osrmRes.status,
        osrmRes.statusText,
      );
      return NextResponse.json(
        {
          status: "error",
          message: "経路情報の取得に失敗しました",
        },
        { status: 502 },
      );
    }

    const osrmData = (await osrmRes.json()) as OsrmRouteResponse;

    if (!osrmData.routes?.length) {
      return NextResponse.json(
        {
          status: "error",
          message: "経路が見つかりませんでした",
        },
        { status: 404 },
      );
    }

    const bestRoute = osrmData.routes[0];
    const geometry = bestRoute.geometry;

    return NextResponse.json({
      status: "success",
      route: {
        geometry,
        distance: bestRoute.distance,
        duration: bestRoute.duration,
      },
    });
  } catch (error: any) {
    console.error("[/api/routes] unexpected error", error);
    return NextResponse.json(
      {
        status: "error",
        message: "予期せぬエラーが発生しました",
        detail: error?.message ?? String(error),
      },
      { status: 500 },
    );
  }
}


