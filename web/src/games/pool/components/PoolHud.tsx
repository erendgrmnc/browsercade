import { Button } from "@/shared/ui/Button";
import type { PoolPhase } from "../domain/types";

export function PoolHud({
  pocketed,
  phase,
  restart,
}: {
  pocketed: number;
  phase: PoolPhase;
  restart: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Pocketed</p>
        <p className="mt-1 font-display text-3xl text-ink">
          {pocketed}
          <span className="ml-1 text-base text-faint">/ 15</span>
        </p>
        <p className="mt-1 text-sm text-muted">{statusText(phase)}</p>
      </div>

      {phase === "won" && <Button onClick={restart}>New rack</Button>}

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Aim from the white cue ball with your mouse — the further you point, the harder you hit.
        Click to strike. Sink all 15 object balls.
      </p>
    </div>
  );
}

function statusText(phase: PoolPhase): string {
  switch (phase) {
    case "won":
      return "Table cleared! 🎱";
    case "shooting":
      return "Balls rolling…";
    default:
      return "Aim, then click to shoot.";
  }
}
