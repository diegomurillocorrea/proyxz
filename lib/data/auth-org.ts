import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgContext = {
  supabase: SupabaseClient;
  /** Usuario autenticado (auth.users). */
  userId: string;
  orgId: string;
};

/** Sesión + membresía de organización (RLS usa el mismo usuario). */
export async function requireOrgContext(): Promise<OrgContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) {
    throw new Error("No autenticado");
  }
  const { data: m, error: mErr } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (mErr || !m?.organization_id) {
    throw new Error("Sin organización. Recargá el dashboard.");
  }
  return { supabase, userId: user.id, orgId: m.organization_id as string };
}
