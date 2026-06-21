/** Composes the 3D board canvas with the control panel into the playable game. */
import { Canvas } from "@react-three/fiber";
import { Board3D } from "./board/Board3D";
import { ControlPanel } from "./ControlPanel";
import { useChessGame } from "@/hooks/useChessGame";

export function ChessGame() {
  const game = useChessGame();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="relative h-[440px] overflow-hidden rounded-2xl border border-hairline bg-paper sm:h-[560px]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 9, 8.5], fov: 42 }}>
          <Board3D
            board={game.board}
            selected={game.selected}
            legalTargets={game.legalTargets}
            lastMove={game.lastMove}
            flipped={game.flipped}
            onSquare={game.onSquare}
          />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          drag to orbit · scroll to zoom
        </span>
      </div>

      <ControlPanel game={game} />
    </div>
  );
}
