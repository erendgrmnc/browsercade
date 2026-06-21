/** The 3D board scene: lighting, base plate, 64 squares, and orbit controls. */
import { OrbitControls } from "@react-three/drei";
import { BoardSquare } from "./BoardSquare";
import { palette } from "@/games/chess/theme";
import { squareToXZ, toSquare } from "@/games/chess/domain/chess/squares";
import type { BoardCell, Square } from "@/games/chess/domain/chess/types";

export function Board3D({
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
  const targets = new Set(legalTargets);

  return (
    <>
      <color attach="background" args={[palette.boardBackground]} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[5, 11, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 6, -4]} intensity={0.3} />

      <group rotation={[0, flipped ? Math.PI : 0, 0]}>
        <mesh position={[0, -0.22, 0]} receiveShadow>
          <boxGeometry args={[9, 0.25, 9]} />
          <meshStandardMaterial color={palette.basePlate} roughness={0.8} />
        </mesh>

        {board.map((row, r) =>
          row.map((cell, c) => {
            // board[r][c]: r = 0 is rank 8, c = 0 is file a.
            const file = c;
            const rank0 = 7 - r;
            const square = toSquare(file, rank0);
            const [x, z] = squareToXZ(file, rank0);
            return (
              <BoardSquare
                key={square}
                square={square}
                x={x}
                z={z}
                isDark={(file + rank0) % 2 === 0}
                cell={cell}
                isSelected={selected === square}
                isLast={!!lastMove && (lastMove.from === square || lastMove.to === square)}
                isTarget={targets.has(square)}
                onSelect={onSquare}
              />
            );
          }),
        )}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={20}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
}
