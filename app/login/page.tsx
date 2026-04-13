import { Suspense } from "react";
import { DaiegoFooter } from "@/components/dashboard/daiego-footer";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
              Cargando…
            </p>
          </div>
          <DaiegoFooter />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
