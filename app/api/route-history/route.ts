import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** 経路履歴は既存の records + target_places + path_points から組み立てます（route_history テーブルは未使用） */

/** RouteRecord に相当するリクエスト body（POST は未使用・互換用） */
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

/** 2点間の Haversine 距離（km） */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type RecordRow = {
  id: string;
  created_at: string | null;
  completed_at: string | null;
  start_lat: number | null;
  start_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
};
type TargetPlaceRow = { record_id: string; name: string | null; lat: number | null; lng: number | null };
type PathPointRow = { record_id: string; recorded_at: string | null; lat: number | null; lng: number | null };

/** 経路履歴一覧取得（records + target_places + path_points から組み立て） */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { status: "error", message: "認証が必要です" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date")?.trim();

    let recordsQuery = supabase
      .from("records")
      .select("id, created_at, completed_at, start_lat, start_lng, dest_lat, dest_lng")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("created_at", { ascending: false });

    const { data: records, error: recordsError } = await recordsQuery;

    if (recordsError) {
      console.error("[/api/route-history] GET records error", recordsError);
      return NextResponse.json(
        { status: "error", message: "経路履歴の取得に失敗しました", detail: recordsError.message },
        { status: 500 },
      );
    }

    const rows = (records ?? []) as RecordRow[];
    let filtered = rows;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      filtered = rows.filter((r) => r.created_at?.slice(0, 10) === dateParam);
    }
    if (filtered.length === 0) {
      return NextResponse.json({ status: "success", routes: [] });
    }

    const recordIds = filtered.map((r) => r.id);
    const { data: targets } = await supabase
      .from("target_places")
      .select("record_id, name, lat, lng")
      .in("record_id", recordIds);
    const { data: points } = await supabase
      .from("path_points")
      .select("record_id, recorded_at, lat, lng")
      .in("record_id", recordIds)
      .order("recorded_at", { ascending: true });

    const targetsByRecord = new Map<string, TargetPlaceRow>();
    for (const t of (targets ?? []) as TargetPlaceRow[]) {
      if (!targetsByRecord.has(t.record_id)) targetsByRecord.set(t.record_id, t);
    }
    const pointsByRecord = new Map<string, PathPointRow[]>();
    for (const p of (points ?? []) as PathPointRow[]) {
      const list = pointsByRecord.get(p.record_id) ?? [];
      list.push(p);
      pointsByRecord.set(p.record_id, list);
    }

    const routes = filtered.map((r) => {
      const created = r.created_at ? new Date(r.created_at) : null;
      const completed = r.completed_at ? new Date(r.completed_at) : null;
      const dateStr = r.created_at ? r.created_at.slice(0, 10) : "";
      const startTimeStr = created
        ? `${String(created.getHours()).padStart(2, "0")}:${String(created.getMinutes()).padStart(2, "0")}`
        : "";
      const target = targetsByRecord.get(r.id);
      const endName = target?.name ?? "";
      const endLat = r.dest_lat ?? target?.lat ?? 0;
      const endLng = r.dest_lng ?? target?.lng ?? 0;
      const pathRows = pointsByRecord.get(r.id) ?? [];
      const pathPoints: PathPoint[] = pathRows
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ lat: p.lat!, lng: p.lng! }));

      let distanceKm = 0;
      for (let i = 1; i < pathPoints.length; i++) {
        distanceKm += haversineKm(pathPoints[i - 1].lat, pathPoints[i - 1].lng, pathPoints[i].lat, pathPoints[i].lng);
      }
      if (pathPoints.length < 2 && r.start_lat != null && r.start_lng != null) {
        distanceKm = haversineKm(r.start_lat, r.start_lng, endLat, endLng);
      }
      distanceKm = Math.round(distanceKm * 10) / 10;

      let durationMin = 0;
      if (created && completed) {
        durationMin = Math.max(1, Math.round((completed.getTime() - created.getTime()) / 60000));
      }

      return {
        id: r.id,
        date: dateStr,
        startTime: startTimeStr,
        startName: "現在地",
        endName,
        startLat: r.start_lat ?? 0,
        startLng: r.start_lng ?? 0,
        endLat,
        endLng,
        distanceKm,
        durationMin,
        pathPoints,
        places: [] as RoutePlace[],
      };
    });

    return NextResponse.json({ status: "success", routes });
  } catch (error: unknown) {
    console.error("[/api/route-history] GET unexpected error", error);
    return NextResponse.json(
      { status: "error", message: "予期せぬエラーが発生しました", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
