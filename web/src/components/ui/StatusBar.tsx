import type { GameStatus } from "@/domain/chess/types";

/** Current game status with an animated "thinking" indicator while the AI searches. */
export function StatusBar({ status, thinking }: { status: GameStatus; thinking: boolean }) {
  return (
    <div>
      <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Status</p>
      <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
        {status.text}
        {thinking && <ThinkingDots />}
      </p>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-pulse rounded-full bg-accent"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
