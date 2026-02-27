import { Suspense } from "react";
import { Login } from "../login";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#e8f5e9]">
          読み込み中...
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
