import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type PathPoint = {
  lat: number;
  lng: number;
  recordedAt?: string;
};

type PathPointsRequestBody = {
  recordId: string;
  points: PathPoint[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PathPointsRequestBody>;

    if (!body.recordId || typeof body.recordId !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message: "不正なリクエストです",
          detail: "recordId が指定されていません",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.points) || body.points.length === 0) {
      // 空なら何もしない
      return NextResponse.json({
        status: "success",
        inserted: 0,
      });
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

    const recordId = body.recordId;

    const rows = body.points
      .filter(
        (p): p is Required<Pick<PathPoint, "lat" | "lng">> & PathPoint =>
          typeof p?.lat === "number" && typeof p?.lng === "number",
      )
      .map((p) => ({
        user_id: user.id,
        record_id: recordId,
        lat: p.lat,
        lng: p.lng,
        recorded_at: p.recordedAt ?? new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({
        status: "success",
        inserted: 0,
      });
    }

    const { error: insertError } = await supabase.from("path_points").insert(
      rows,
    );

    if (insertError) {
      console.error("[/api/path-points] failed to insert points", insertError);
      return NextResponse.json(
        {
          status: "error",
          message: "経路ポイントの保存に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      inserted: rows.length,
    });
  } catch (error: any) {
    console.error("[/api/path-points] unexpected error", error);
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

