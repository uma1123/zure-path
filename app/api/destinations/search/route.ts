import { NextResponse } from "next/server";

type Destination = {
  name: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        {
          status: "error",
          message: "クエリ q が指定されていません",
        },
        { status: 400 },
      );
    }

    const nominatinUrl = new URL(
      "https://nominatim.openstreetmap.org/search",
    );
    nominatinUrl.searchParams.set("format", "jsonv2");
    nominatinUrl.searchParams.set("q", q);
    nominatinUrl.searchParams.set("limit", "5");
    nominatinUrl.searchParams.set("accept-language", "ja");

    const res = await fetch(nominatinUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "zure-path-app/1.0 (Nominatim search)",
      },
    });

    if (!res.ok) {
      console.error(
        "[/api/destinations/search] Nominatim error:",
        res.status,
        res.statusText,
      );
      return NextResponse.json(
        {
          status: "error",
          message: "目的地検索に失敗しました",
        },
        { status: 502 },
      );
    }

    const data = (await res.json()) as NominatimResult[];

    const results: Destination[] = data
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          name: item.display_name,
          lat,
          lng,
        };
      })
      .filter((v): v is Destination => v !== null);

    return NextResponse.json({
      status: "success",
      results,
    });
  } catch (error: any) {
    console.error("[/api/destinations/search] unexpected error", error);
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

