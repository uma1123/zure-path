import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Supabase に route_history テーブルが必要です。
 * 例: create table route_history (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id),
 *   date text not null,
 *   start_time text not null,
 *   start_name text not null,
 *   end_name text not null,
 *   start_lat double precision not null,
 *   start_lng double precision not null,
 *   end_lat double precision not null,
 *   end_lng double precision not null,
 *   distance_km double precision not null,
 *   duration_min integer not null,
 *   path_points jsonb not null default '[]',
 *   places jsonb not null default '[]',
 *   created_at timestamptz default now()
 * );
 */

/** RouteRecord に相当するリクエスト body */
type PathPoint = { lat: number; lng: number };
type RoutePlace = {
  id: string;
  name: string;
  category: string;
  hours?: string;
  distance?: string;
  rating?: number;
  comment?: string;
  imageUrl?: string;
  status: "visited" | "wanted" | "discovered";
};
type RouteHistoryBody = {
  id?: string;
  date: string;
  startTime: string;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RouteHistoryBody;

    if (
      typeof body.date !== "string" ||
      typeof body.startTime !== "string" ||
      typeof body.startName !== "string" ||
      typeof body.endName !== "string" ||
      typeof body.startLat !== "number" ||
      typeof body.startLng !== "number" ||
      typeof body.endLat !== "number" ||
      typeof body.endLng !== "number" ||
      typeof body.distanceKm !== "number" ||
      typeof body.durationMin !== "number" ||
      !Array.isArray(body.pathPoints) ||
      !Array.isArray(body.places)
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "不正なリクエストです",
          detail: "必須フィールドが不足しています",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          status: "error",
          message: "認証が必要です",
        },
        { status: 401 },
      );
    }

    const row = {
      user_id: user.id,
      date: body.date,
      start_time: body.startTime,
      start_name: body.startName,
      end_name: body.endName,
      start_lat: body.startLat,
      start_lng: body.startLng,
      end_lat: body.endLat,
      end_lng: body.endLng,
      distance_km: body.distanceKm,
      duration_min: body.durationMin,
      path_points: body.pathPoints,
      places: body.places,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("route_history")
      .insert(row)
      .select("id")
      .single();

    if (insertError) {
      console.error("[/api/route-history] insert error", insertError);
      return NextResponse.json(
        {
          status: "error",
          message: "経路履歴の保存に失敗しました",
          detail: insertError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      id: inserted?.id ?? body.id,
    });
  } catch (error: unknown) {
    console.error("[/api/route-history] unexpected error", error);
    return NextResponse.json(
      {
        status: "error",
        message: "予期せぬエラーが発生しました",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/** DB 行を RouteRecord 形に変換 */
function rowToRouteRecord(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    date: String(row.date ?? ""),
    startTime: String(row.start_time ?? ""),
    startName: String(row.start_name ?? ""),
    endName: String(row.end_name ?? ""),
    startLat: Number(row.start_lat ?? 0),
    startLng: Number(row.start_lng ?? 0),
    endLat: Number(row.end_lat ?? 0),
    endLng: Number(row.end_lng ?? 0),
    distanceKm: Number(row.distance_km ?? 0),
    durationMin: Number(row.duration_min ?? 0),
    pathPoints: Array.isArray(row.path_points) ? row.path_points : [],
    places: Array.isArray(row.places) ? row.places : [],
  };
}

/** 経路履歴一覧取得（認証必須、任意で date クエリ） */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          status: "error",
          message: "認証が必要です",
        },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date")?.trim();

    let query = supabase
      .from("route_history")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      query = query.eq("date", dateParam);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[/api/route-history] GET select error", error);
      return NextResponse.json(
        {
          status: "error",
          message: "経路履歴の取得に失敗しました",
          detail: error.message,
        },
        { status: 500 },
      );
    }

    const routes = (rows ?? []).map((row) => rowToRouteRecord(row as Record<string, unknown>));

    return NextResponse.json({
      status: "success",
      routes,
    });
  } catch (error: unknown) {
    console.error("[/api/route-history] GET unexpected error", error);
    return NextResponse.json(
      {
        status: "error",
        message: "予期せぬエラーが発生しました",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
