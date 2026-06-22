import type { CSSProperties } from "react";
import "./controls.css";

export type Option<T> = { label: string; value: T };

/**
 * A labelled row of mutually-exclusive options with a sliding glow indicator
 * that tracks the active choice. Used for in-game settings (difficulty, etc.).
 */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const style = { "--i": index, "--n": options.length } as CSSProperties;

  return (
    <div>
      {label && (
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-mono text-faint">{label}</p>
      )}
      <div role="tablist" aria-label={label} className="bc-seg" style={style}>
        <span className="bc-seg-thumb" aria-hidden />
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={o.value === value}
            className="bc-seg-opt"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
