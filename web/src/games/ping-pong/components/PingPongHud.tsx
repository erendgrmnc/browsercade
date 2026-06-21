import { Button } from "@/shared/ui/Button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { RULES } from "../config";
import type { Phase, Score } from "../domain/types";

const LEVELS: { label: string; value: number }[] = [
  { label: "Easy", value: 0.4 },
  { label: "Medium", value: 0.6 },
  { label: "Hard", value: 0.85 },
];

export function PingPongHud({
  score,
  phase,
  difficulty,
  setDifficulty,
  restart,
}: {
  score: Score;
  phase: Phase;
  difficulty: number;
  setDifficulty: (value: number) => void;
  restart: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">
          Score — first to {RULES.winScore}
        </p>
        <p className="mt-1 flex items-center gap-3 font-display text-2xl text-ink">
          <span className="text-accent">{score.player}</span>
          <span className="text-faint">:</span>
          <span style={{ color: "#e2483b" }}>{score.ai}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{statusText(phase, score)}</p>
      </div>

      <SegmentedControl
        label="Difficulty"
        options={LEVELS}
        value={difficulty}
        onChange={setDifficulty}
      />

      <Button onClick={restart}>Restart</Button>

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Move your mouse to slide the near <span className="text-accent">blue</span> paddle. Get the
        ball past the AI to score. Hit with the paddle&apos;s edge to angle your return.
      </p>
    </div>
  );
}

function statusText(phase: Phase, score: Score): string {
  switch (phase) {
    case "gameover":
      return score.player > score.ai ? "You win! 🏓" : "AI wins — rematch?";
    case "serving":
      return "Get ready…";
    case "point":
      return "Point!";
    default:
      return "Rally!";
  }
}
