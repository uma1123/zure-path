"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export type AuthMode = "signin" | "signup";

type LoginProps = {
  mode?: AuthMode;
};

export function Login({ mode = "signin" }: LoginProps) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  const signInHref = `/sign-in${query}`;
  const signUpHref = `/sign-up${query}`;

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold text-foreground">
          {mode === "signin"
            ? "アカウントにログイン"
            : "アカウントを作成"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
            setError("");
            // TODO: Supabase signIn / signUp をここで呼ぶ
            setPending(false);
          }}
        >
          <input type="hidden" name="redirect" value={redirect ?? ""} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              メールアドレス
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={50}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="メールアドレスを入力"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              パスワード
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                maxLength={100}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="パスワードを入力"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-foreground"
              >
                パスワード（確認）
              </label>
              <div className="mt-1">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="パスワードを再入力"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={pending}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {pending
                ? "処理中..."
                : mode === "signin"
                  ? "ログイン"
                  : "アカウント作成"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-muted px-2 text-muted-foreground">
                {mode === "signin"
                  ? "アカウントをお持ちでない方"
                  : "すでにアカウントがある方"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={mode === "signin" ? signUpHref : signInHref}
              className="w-full flex justify-center py-2 px-4 border border-border rounded-lg text-sm font-medium text-foreground bg-background hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {mode === "signin"
                ? "サインアップ"
                : "ログイン"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
