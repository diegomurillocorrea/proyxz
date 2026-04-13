import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./public-env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key, isConfigured } = getSupabasePublicConfig();

  if (!isConfigured) {
    throw new Error(
      "Supabase: definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en .env.local",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamada desde Server Component sin mutar cookies; el middleware refresca la sesión.
        }
      },
    },
  });
}
