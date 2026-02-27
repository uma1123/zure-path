import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type CreateVisitRequestBody = {
  recordId: string;
  targetPlaceId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateVisitRequestBody>;

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
    const targetPlaceId =
      typeof body.targetPlaceId === "string" ? body.targetPlaceId : null;

    // records.completed_at を更新
    const { error: recordError } = await supabase
      .from("records")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", recordId)
      .eq("user_id", user.id);

    if (recordError) {
      console.error("[/api/visits] failed to update record", recordError);
      return NextResponse.json(
        {
          status: "error",
          message: "走行記録の更新に失敗しました",
        },
        { status: 500 },
      );
    }

    // 関連する target_places.is_reached を true にする（あれば）
    if (targetPlaceId) {
      const { error: targetError } = await supabase
        .from("target_places")
        .update({ is_reached: true })
        .eq("id", targetPlaceId)
        .eq("user_id", user.id);

      if (targetError) {
        console.error(
          "[/api/visits] failed to update target_place",
          targetError,
        );
        // ここは致命的ではないので 200 を返しつつログだけ残す
      }
    }

    return NextResponse.json({
      status: "success",
      recordId,
      targetPlaceId: targetPlaceId ?? null,
    });
  } catch (error: any) {
    console.error("[/api/visits] unexpected error", error);
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

