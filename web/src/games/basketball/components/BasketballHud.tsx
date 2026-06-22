import { Button } from "@/shared/ui/Button";
import type { AimStage, BasketballPhase, BasketballStats } from "../domain/BasketballGame";
import { stageLabel } from "./aimText";

export function BasketballHud({
  stats,
  clock,
  phase,
  stage,
  restart,
}: {
  stats: BasketballStats;
  clock: number;
  phase: BasketballPhase;
  stage: AimStage;
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
          {phase === "gameover" ? `Time! ${stats.made} baskets made.` : stageLabel(stage)}
        </p>
      </div>

      {phase === "gameover" && <Button onClick={restart}>Play again</Button>}

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Two presses per shot: click to lock the <b>arc</b> (the arrow swings up/down), then the
        <b> power</b> — stop the bar on the green sweet spot to swish it.
      </p>
    </div>
  );
}
