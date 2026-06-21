/** Side panel: status, game setup, actions, and the move list. */
import { Button } from "./ui/Button";
import { MoveList } from "./ui/MoveList";
import { SegmentedControl } from "./ui/SegmentedControl";
import { StatusBar } from "./ui/StatusBar";
import type { ChessGameState } from "@/hooks/useChessGame";
import type { PieceColor } from "@/domain/chess/types";

const COLOR_OPTIONS: { label: string; value: PieceColor }[] = [
  { label: "White", value: "w" },
  { label: "Black", value: "b" },
];

const LEVEL_OPTIONS: { label: string; value: number }[] = [
  { label: "Easy", value: 2 },
  { label: "Medium", value: 3 },
  { label: "Hard", value: 4 },
];

export function ControlPanel({ game }: { game: ChessGameState }) {
  return (
    <div className="flex flex-col gap-5">
      <StatusBar status={game.status} thinking={game.thinking} />

      <SegmentedControl
        label="Play as"
        options={COLOR_OPTIONS}
        value={game.playerColor}
        onChange={game.newGame}
      />
      <SegmentedControl
        label="Difficulty"
        options={LEVEL_OPTIONS}
        value={game.level}
        onChange={game.setLevel}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => game.newGame(game.playerColor)}>New game</Button>
        <Button onClick={game.undo}>Undo</Button>
        <Button active={game.flipped} onClick={game.toggleFlip}>
          Flip
        </Button>
      </div>

      <MoveList history={game.history} />

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Pawns auto-promote to a queen. The opponent is a hand-written negamax + alpha-beta engine
        running in a Web Worker — difficulty sets its search depth.
      </p>
    </div>
  );
}
