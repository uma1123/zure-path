import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type StartRecordRequestBody = {
  startLat: number;
  startLng: number;
  destName: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<StartRecordRequestBody>;

    if (
      typeof body.startLat !== "number" ||
      typeof body.startLng !== "number" ||
      typeof body.destName !== "string" ||
      !body.destName.trim()
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "不正なリクエストです",
          detail: "start/dest 座標または destName が不足しています",
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

    const startLat = body.startLat;
    const startLng = body.startLng;
    const destName = body.destName.trim();

    // 1. records を作成
    const { data: record, error: recordError } = await supabase
      .from("records")
      .insert({
        user_id: user.id,
        start_lat: startLat,
        start_lng: startLng,
      })
      .select()
      .single();

    if (recordError || !record) {
      console.error("[/api/records/start] failed to insert record", recordError);
      return NextResponse.json(
        {
          status: "error",
          message: "走行記録の開始に失敗しました",
        },
        { status: 500 },
      );
    }

    // 2. target_places を作成
    const { data: targetPlace, error: targetError } = await supabase
      .from("target_places")
      .insert({
        user_id: user.id,
        record_id: record.id,
        name: destName,
      })
      .select()
      .single();

    if (targetError || !targetPlace) {
      console.error(
        "[/api/records/start] failed to insert target_place",
        targetError,
      );
      return NextResponse.json(
        {
          status: "error",
          message: "目的地の保存に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      recordId: record.id as string,
      targetPlaceId: targetPlace.id as string,
    });
  } catch (error: any) {
    console.error("[/api/records/start] unexpected error", error);
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

