"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signInAction(
  email: string,
  password: string,
  redirectTo?: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo || "/");
}

export async function signUpAction(
  email: string,
  password: string,
  redirectTo?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // メール確認が必要な場合はセッションが作成されない
  if (!data.session) {
    return { error: null, needsConfirmation: true };
  }

  redirect(redirectTo || "/");
}
