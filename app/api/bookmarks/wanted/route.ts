import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SaveWantedBody = {
  name: string;
  category: string;
  distanceMeters?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SaveWantedBody>;

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message: "name は必須です",
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

    const trimmedName = body.name.trim();

    // 同一ユーザー・同一名称のものは一度削除してから挿入（事実上の一意制約）
    await supabase
      .from("wanted_places")
      .delete()
      .eq("user_id", user.id)
      .eq("name", trimmedName);

    const { error: insertError } = await supabase.from("wanted_places").insert({
      user_id: user.id,
      name: trimmedName,
      category: (body.category ?? "").trim(),
      distance_m:
        typeof body.distanceMeters === "number" &&
        Number.isFinite(body.distanceMeters)
          ? Math.round(body.distanceMeters)
          : null,
    });

    if (insertError) {
      console.error("[/api/bookmarks/wanted] insert error", insertError);
      return NextResponse.json(
        {
          status: "error",
          message: "ブックマーク（行きたい）の保存に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error: any) {
    console.error("[/api/bookmarks/wanted] unexpected error", error);
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

export async function GET() {
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

    const { data, error } = await supabase
      .from("wanted_places")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/bookmarks/wanted] select error", error);
      return NextResponse.json(
        {
          status: "error",
          message: "ブックマーク（行きたい）の取得に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      rows: data ?? [],
    });
  } catch (error: any) {
    console.error("[/api/bookmarks/wanted] unexpected error (GET)", error);
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

