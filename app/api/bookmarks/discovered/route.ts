import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SaveDiscoveredBody = {
  name: string;
  category?: string;
  comment?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SaveDiscoveredBody>;

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

    // 同一ユーザー・同一名称のものは一度削除してから挿入（重複防止）
    await supabase
      .from("discovered_places")
      .delete()
      .eq("user_id", user.id)
      .eq("name", trimmedName);

    const { error: insertError } = await supabase.from("discovered_places")
      .insert({
        user_id: user.id,
        name: trimmedName,
        category: (body.category ?? "").trim(),
        comment: body.comment ?? null,
        image_url: body.imageUrl ?? null,
        lat:
          typeof body.lat === "number" && Number.isFinite(body.lat)
            ? body.lat
            : null,
        lng:
          typeof body.lng === "number" && Number.isFinite(body.lng)
            ? body.lng
            : null,
      });

    if (insertError) {
      console.error("[/api/bookmarks/discovered] insert error", insertError);
      return NextResponse.json(
        {
          status: "error",
          message: "ブックマーク（発見した）の保存に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error: any) {
    console.error("[/api/bookmarks/discovered] unexpected error", error);
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
      .from("discovered_places")
      .select("*")
      .eq("user_id", user.id)
      .order("discovered_at", { ascending: false });

    if (error) {
      console.error("[/api/bookmarks/discovered] select error", error);
      return NextResponse.json(
        {
          status: "error",
          message: "ブックマーク（発見した）の取得に失敗しました",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      rows: data ?? [],
    });
  } catch (error: any) {
    console.error("[/api/bookmarks/discovered] unexpected error (GET)", error);
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

