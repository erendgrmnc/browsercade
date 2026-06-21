import { Button } from "@/shared/ui/Button";
import type { BasketballPhase, BasketballStats } from "../domain/BasketballGame";

export function BasketballHud({
  stats,
  clock,
  phase,
  restart,
}: {
  stats: BasketballStats;
  clock: number;
  phase: BasketballPhase;
  restart: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Time</p>
        <p className="mt-1 font-display text-3xl text-ink">{Math.ceil(clock)}s</p>
      </div>

      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Baskets</p>
        <p className="mt-1 font-display text-2xl text-ink">
          {stats.made}
          <span className="ml-1 text-base text-faint">/ {stats.attempts}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {phase === "gameover" ? `Time! ${stats.made} baskets made.` : "Click to shoot."}
        </p>
      </div>

      {phase === "gameover" && <Button onClick={restart}>Play again</Button>}

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Move the mouse left/right to aim and up/down for power, then click to shoot. The blue ring
        shows your range — drop it on the hoop.
      </p>
    </div>
  );
}
