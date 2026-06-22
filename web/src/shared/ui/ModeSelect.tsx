import type { CSSProperties, ReactNode } from "react";
import "./controls.css";

export type ModeOption<T> = { label: string; value: T; icon?: ReactNode };

/**
 * The headline mode toggle that opens every game (vs Computer / Online, etc).
 * A sliding glow "thumb" tracks the active segment; icons read at a glance.
 */
export function ModeSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: ModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const style = { "--i": index, "--n": options.length } as CSSProperties;

  return (
    <div role="tablist" aria-label={label ?? "Game mode"} className="bc-modes" style={style}>
      <span className="bc-modes-thumb" aria-hidden />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={selected}
            className="bc-mode"
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
