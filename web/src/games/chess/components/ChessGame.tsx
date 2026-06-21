/** Composes the 3D board with the control panel into the vs-AI game. */
import { BoardCanvas } from "./board/BoardCanvas";
import { ControlPanel } from "./ControlPanel";
import { useChessGame } from "@/games/chess/hooks/useChessGame";

export function ChessGame() {
  const game = useChessGame();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <BoardCanvas
        board={game.board}
        selected={game.selected}
        legalTargets={game.legalTargets}
        lastMove={game.lastMove}
        flipped={game.flipped}
        onSquare={game.onSquare}
      />
      <ControlPanel game={game} />
    </div>
  );
}
