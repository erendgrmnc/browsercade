import { Button } from "./Button";

export type Option<T> = { label: string; value: T };

/** A labelled row of mutually-exclusive pill options. */
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
  return (
    <div>
      {label && (
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-mono text-faint">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={String(o.value)} active={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
