import { Button } from "@/shared/ui/Button";
import type { BeerPongPhase, BeerPongStats } from "../domain/BeerPongGame";

export function BeerPongHud({
  stats,
  phase,
  restart,
}: {
  stats: BeerPongStats;
  phase: BeerPongPhase;
  restart: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Cups left</p>
        <p className="mt-1 font-display text-3xl text-ink">{stats.cupsLeft}</p>
      </div>

      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Throws</p>
        <p className="mt-1 font-display text-2xl text-ink">{stats.throws}</p>
        <p className="mt-1 text-sm text-muted">
          {phase === "won" ? `Rack cleared in ${stats.throws} throws! 🍺` : "Click to throw."}
        </p>
      </div>

      {phase === "won" && <Button onClick={restart}>Rack &apos;em again</Button>}

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Move the mouse to aim and set power, then click to throw. Land the ball in every cup. The
        blue ring shows your range.
      </p>
    </div>
  );
}
