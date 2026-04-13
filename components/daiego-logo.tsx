import Image from "next/image";
import Link from "next/link";

type Props = {
  /** compacto para sidebar */
  variant?: "default" | "compact";
  href?: string;
};

const linkFocus =
  "rounded-xl outline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-900";

/**
 * Logo DAIEGO desde `/public/DAIEGO.png` (canónico skill daiego-ui).
 */
export function DaiegoLogo({ variant = "default", href = "/" }: Props) {
  const row =
    variant === "compact"
      ? "flex flex-row items-center gap-2"
      : "flex flex-row items-center justify-center gap-2.5 sm:justify-start";

  const inner = (
    <span className={row}>
      <Image
        src="/DAIEGO.png"
        alt="DAIEGO"
        width={1024}
        height={1024}
        priority
        className={
          variant === "compact"
            ? "h-8 w-8 shrink-0 object-contain"
            : "h-12 w-12 shrink-0 object-contain sm:h-12"
        }
        sizes={variant === "compact" ? "32px" : "48px"}
      />
      <span
        className={
          variant === "compact"
            ? "text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            : "text-base font-semibold tracking-tight text-zinc-600 dark:text-zinc-300"
        }
      >
        Proyxz
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={linkFocus} aria-label="DAIEGO Proyxz — inicio">
        {inner}
      </Link>
    );
  }

  return inner;
}
