import { useRef, type KeyboardEvent } from "react";
import "./controls.css";

/**
 * A 4-cell room-code field. A single hidden input captures the keystrokes;
 * the visible cells render each character, glow on the caret, and pop as they
 * fill. `length` defaults to the 4-letter relay room code.
 */
export function CodeInput({
  value,
  onChange,
  onEnter,
  length = 4,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  onEnter?: () => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const cells = Array.from({ length });
  const focus = () => ref.current?.focus();

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onEnter?.();
  }

  return (
    <div className="bc-code" onClick={focus} role="group" aria-label="Room code">
      <input
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) =>
          onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length))
        }
        onKeyDown={handleKey}
        maxLength={length}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-label="Room code"
        className="bc-code-input"
      />
      {cells.map((_, i) => {
        const char = value[i] ?? "";
        const active = i === value.length || (value.length === length && i === length - 1);
        return (
          <div
            key={i}
            className={`bc-code-cell${char ? " is-filled" : ""}${active ? " is-active" : ""}`}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}
