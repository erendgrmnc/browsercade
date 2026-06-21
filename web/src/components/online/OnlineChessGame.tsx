/** Online multiplayer mode: the shared 3D board + the online lobby/game panel. */
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { OnlinePanel } from "./OnlinePanel";
import { useOnlineGame } from "@/hooks/useOnlineGame";

export function OnlineChessGame() {
  const game = useOnlineGame();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <BoardCanvas
        board={game.board}
        selected={game.selected}
        legalTargets={game.legalTargets}
        lastMove={game.lastMove}
        flipped={game.myColor === "b"}
        onSquare={game.onSquare}
      />
      <OnlinePanel game={game} />
    </div>
  );
}
