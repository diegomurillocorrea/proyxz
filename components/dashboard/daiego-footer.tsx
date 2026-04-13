import Image from "next/image";

/** Variante R — misma barra que Finance / referencia daiego-ui (logo ancho + copyright). */
export function DaiegoFooter() {
  return (
    <footer
      className="flex w-full flex-wrap items-center justify-between gap-4 bg-emerald-500 px-4 py-4 text-zinc-900 sm:px-6 lg:px-8"
      role="contentinfo"
      aria-label="Pie de página"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Image
          src="/DAIEGO.png"
          alt="DAIEGO"
          width={112}
          height={112}
          className="max-h-9 w-auto object-contain drop-shadow-sm"
          sizes="112px"
        />
      </div>
      <span className="text-sm font-medium" aria-label="DAIEGO LLC copyright 2026">
        DAIEGO LLC © 2026
      </span>
    </footer>
  );
}
