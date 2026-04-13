"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { getSupabasePublicConfig } from "@/utils/supabase/public-env";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const missingEnv = !getSupabasePublicConfig().isConfigured;

  useEffect(() => {
    if (missingEnv) return;

    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }
      startTransition(() => {
        setOk(true);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        startTransition(() => setOk(false));
        return;
      }
      startTransition(() => setOk(true));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, missingEnv]);

  if (missingEnv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 px-4 dark:bg-zinc-950">
        <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-300" role="alert">
          Configurá <span className="font-mono">.env.local</span> con{" "}
          <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> y la clave pública de Supabase, luego reiniciá{" "}
          <span className="font-mono">npm run dev</span>.
        </p>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
          Cargando…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
