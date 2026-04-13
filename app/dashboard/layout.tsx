import { AuthGate } from "@/components/dashboard/auth-gate";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DaiegoFooter } from "@/components/dashboard/daiego-footer";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { loadOrgState } from "@/lib/data/load-org-state";
import { mockOrgState } from "@/lib/mock-org-state";
import { OrgStoreProvider } from "@/lib/org-store";
import { createClient } from "@/utils/supabase/server";
import { getSupabasePublicConfig } from "@/utils/supabase/public-env";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let initialState = mockOrgState;

  if (getSupabasePublicConfig().isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login?next=/dashboard");
    }
    const { error: rpcErr } = await supabase.rpc("ensure_org_for_user");
    if (rpcErr) {
      throw new Error(
        `Supabase: ${rpcErr.message}. Ejecutá la migración en supabase/migrations/ si aún no lo hiciste.`,
      );
    }
    initialState = await loadOrgState(supabase);
  }

  return (
    <AuthGate>
      <OrgStoreProvider initialState={initialState}>
        <div className="fixed inset-0 flex overflow-hidden bg-white dark:bg-zinc-950">
          <AppSidebar />
          <MobileNav />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">
            <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
            <DaiegoFooter />
          </div>
        </div>
      </OrgStoreProvider>
    </AuthGate>
  );
}
