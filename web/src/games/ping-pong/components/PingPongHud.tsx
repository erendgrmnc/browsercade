import { Button } from "@/shared/ui/Button";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { RULES } from "../config";
import type { Phase, Score, Side } from "../domain/types";

const LEVELS: { label: string; value: number }[] = [
  { label: "Easy", value: 0.4 },
  { label: "Medium", value: 0.6 },
  { label: "Hard", value: 0.85 },
];

const CONTROLS = [
  "Move mouse — slide your paddle",
  "Hold mouse — charge a power shot",
  "Hit off-centre — angle the return",
  "Mouse up / down — aim deep or short",
  "Your serve — hold, then release",
];

export function PingPongHud({
  score,
  phase,
  server,
  difficulty,
  setDifficulty,
  restart,
}: {
  score: Score;
  phase: Phase;
  server: Side;
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
        <p className="mt-1 text-sm text-muted">{statusText(phase, server, score)}</p>
      </div>

      <SegmentedControl label="Difficulty" options={LEVELS} value={difficulty} onChange={setDifficulty} />
      <Button onClick={restart}>Restart</Button>

      <div>
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-mono text-faint">Controls</p>
        <ul className="space-y-1 text-[0.78rem] leading-relaxed text-faint">
          {CONTROLS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function statusText(phase: Phase, server: Side, score: Score): string {
  switch (phase) {
    case "gameover":
      return score.player > score.ai ? "You win! 🏓" : "AI wins — rematch?";
    case "serving":
      return server === "player" ? "Your serve — hold, then release" : "AI serving…";
    case "point":
      return "Point!";
    default:
      return "Rally!";
  }
}
