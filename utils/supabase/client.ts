import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./public-env";

export function createClient() {
  const { url, key, isConfigured } = getSupabasePublicConfig();

  if (!isConfigured) {
    throw new Error(
      "Supabase: definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en .env.local",
    );
  }

  return createBrowserClient(url, key);
}
