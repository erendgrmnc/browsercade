import type { ReactNode } from "react";

/** A small pill button. `active` paints it with the accent. */
export function Button({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-mono transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-hairline text-muted hover:border-ink/40 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
