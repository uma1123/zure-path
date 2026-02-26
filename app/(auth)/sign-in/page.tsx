import { Suspense } from "react";
import { Login } from "../login";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">読み込み中...</div>}>
      <Login mode="signin" />
    </Suspense>
  );
}
