import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const isAuthPath =
    url.pathname === "/sign-in" || url.pathname === "/sign-up";

  // 未ログインで認証ページ以外にアクセスした場合は /login にリダイレクト
  if (!user && !isAuthPath) {
    const redirectUrl = new URL("/sign-in", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Supabase が更新したクッキーをリダイレクトレスポンスにも反映
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  // ログイン済みで /sign-in, /sign-up にアクセスした場合はトップへ戻す
  if (user && isAuthPath) {
    const redirectUrl = new URL("/", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
}
