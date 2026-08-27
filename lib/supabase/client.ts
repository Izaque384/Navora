import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}
