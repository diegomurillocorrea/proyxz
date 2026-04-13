"use client";

import Link from "next/link";
import { useOrgStore } from "@/lib/org-store";
import { montosCotizacion } from "@/lib/cotizacion-math";
import { formatUsd } from "@/lib/format";

export default function DashboardHomePage() {
  const {
    proyectos,
    clientes,
    cotizaciones,
    colaboradores,
    entregables,
    estadosProyecto,
  } = useOrgStore();

  const lastCot = cotizaciones[0];
  const lastMontos = lastCot ? montosCotizacion(lastCot) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Resumen
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          El Salvador · USD · IVA 13% en cotizaciones (Supabase).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Proyectos activos" value={String(proyectos.length)} href="/dashboard/proyectos" />
        <StatCard label="Clientes" value={String(clientes.length)} href="/dashboard/clientes" />
        <StatCard label="Cotizaciones" value={String(cotizaciones.length)} href="/dashboard/cotizaciones" />
        <StatCard label="Colaboradores (agenda)" value={String(colaboradores.length)} href="/dashboard/colaboradores" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Cotización de ejemplo
          </h2>
          {lastCot && lastMontos ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Folio</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{lastCot.folio}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Estado</dt>
                <dd className="font-medium capitalize text-zinc-900 dark:text-zinc-100">{lastCot.estado}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
                <dd>{formatUsd(lastMontos.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">IVA 13%</dt>
                <dd>{formatUsd(lastMontos.montoIva)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <dt className="font-medium text-zinc-800 dark:text-zinc-200">Total</dt>
                <dd className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatUsd(lastMontos.total)}
                </dd>
              </div>
            </dl>
          ) : null}
          <Link
            href="/dashboard/cotizaciones"
            className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Ver cotizaciones →
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Estados de proyecto (catálogo)
          </h2>
          <ul className="mt-4 space-y-2">
            {[...estadosProyecto]
              .sort((a, b) => a.orden - b.orden)
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.etiqueta}</span>
                  <span className="text-xs text-zinc-400">{e.slug}</span>
                </li>
              ))}
          </ul>
          <Link
            href="/dashboard/configuracion/estados"
            className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Editar en configuración →
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Entregables pendientes
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {entregables.filter((x) => x.estado === "pendiente").length} pendiente(s).{" "}
          <Link href="/dashboard/entregables" className="font-medium text-emerald-700 dark:text-emerald-400">
            Gestionar entregables →
          </Link>
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
    </Link>
  );
}
