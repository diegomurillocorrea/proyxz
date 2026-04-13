/** URL y clave pública (anon o publishable) para cliente y middleware. */

export function getSupabasePublicConfig(): {
  url: string;
  key: string;
  isConfigured: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  return { url, key, isConfigured: Boolean(url && key) };
}
