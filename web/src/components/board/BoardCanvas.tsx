/** The framed R3F canvas hosting the board. Shared by the AI and online modes. */
import { Canvas } from "@react-three/fiber";
import { Board3D } from "./Board3D";
import type { BoardCell, Square } from "@/domain/chess/types";

export function BoardCanvas({
  board,
  selected,
  legalTargets,
  lastMove,
  flipped,
  onSquare,
}: {
  board: BoardCell[][];
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  flipped: boolean;
  onSquare: (square: Square) => void;
}) {
  return (
    <div className="relative h-[440px] overflow-hidden rounded-2xl border border-hairline bg-paper sm:h-[560px]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 9, 8.5], fov: 42 }}>
        <Board3D
          board={board}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          flipped={flipped}
          onSquare={onSquare}
        />
      </Canvas>
      <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
        drag to orbit · scroll to zoom
      </span>
    </div>
  );
}
