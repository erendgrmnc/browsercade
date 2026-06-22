import { Button } from "@/shared/ui/Button";
import type { BallGroup, PoolPhase, RulesState } from "../domain/types";

export function PoolHud({
  phase,
  rules,
  restart,
}: {
  phase: PoolPhase;
  rules: RulesState;
  restart: () => void;
}) {
  const myGroup = rules.groups[0];
  const yourTurn = rules.currentPlayer === 0;
  const over = phase === "gameover";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Seat label="You" group={rules.groups[0]} active={yourTurn && !over} />
        <span className="font-mono text-xs text-faint">vs</span>
        <Seat label="AI" group={rules.groups[1]} active={!yourTurn && !over} alignRight />
      </div>

      <div className="rounded-xl border border-hairline bg-black/20 px-4 py-3">
        <p className="font-mono text-[0.65rem] uppercase tracking-mono text-faint">
          {over ? "Result" : yourTurn ? "Your turn" : "AI's turn"}
        </p>
        <p className="mt-1 text-sm text-ink">{rules.message}</p>
        {rules.ballInHand && yourTurn && !over && (
          <p className="mt-2 text-xs text-amber-300/90">Ball in hand — click the table to place the cue ball.</p>
        )}
      </div>

      {over && <Button onClick={restart}>New rack</Button>}

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Aim with the mouse, then <span className="text-muted">press &amp; hold to charge power</span> and release to
        strike. Pot your suit{myGroup ? ` (${label(myGroup)})` : ""}, then sink the 8-ball to win. Scratches and wrong-ball
        hits give your opponent ball in hand.
      </p>
    </div>
  );
}

function Seat({
  label: name,
  group,
  active,
  alignRight,
}: {
  label: string;
  group: BallGroup | null;
  active: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className={alignRight ? "text-right" : ""}>
      <p className={`font-display text-lg ${active ? "text-ink" : "text-muted"}`}>
        {active ? "● " : ""}
        {name}
      </p>
      <p className="font-mono text-[0.65rem] uppercase tracking-mono text-faint">{group ? label(group) : "open"}</p>
    </div>
  );
}

function label(group: BallGroup): string {
  switch (group) {
    case "solid":
      return "solids";
    case "stripe":
      return "stripes";
    case "eight":
      return "8-ball";
    default:
      return "";
  }
}
