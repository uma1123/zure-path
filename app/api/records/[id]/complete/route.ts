import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** 走行記録を「到着完了」にする（completed_at をセット） */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: recordId } = await params;
    if (!recordId?.trim()) {
      return NextResponse.json(
        { status: "error", message: "record id が指定されていません" },
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
        { status: "error", message: "認証が必要です" },
        { status: 401 },
      );
    }

    const { error } = await supabase
      .from("records")
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq("id", recordId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[/api/records/complete] update error", error);
      return NextResponse.json(
        {
          status: "error",
          message: "記録の完了に失敗しました",
          detail: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error("[/api/records/complete] unexpected error", e);
    return NextResponse.json(
      {
        status: "error",
        message: "予期せぬエラーが発生しました",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
