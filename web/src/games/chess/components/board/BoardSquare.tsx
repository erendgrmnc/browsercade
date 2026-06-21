/** One board square: the tile, its highlights, and any piece standing on it. */
import { Piece } from "./Pieces";
import { palette } from "@/games/chess/theme";
import type { BoardCell, Square } from "@/games/chess/domain/chess/types";

export function BoardSquare({
  square,
  x,
  z,
  isDark,
  cell,
  isSelected,
  isLast,
  isTarget,
  onSelect,
}: {
  square: Square;
  x: number;
  z: number;
  isDark: boolean;
  cell: BoardCell;
  isSelected: boolean;
  isLast: boolean;
  isTarget: boolean;
  onSelect: (square: Square) => void;
}) {
  const select = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(square);
  };

  return (
    <group position={[x, 0, z]}>
      {/* tile */}
      <mesh position={[0, -0.1, 0]} receiveShadow onClick={select}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial color={isDark ? palette.darkSquare : palette.lightSquare} roughness={0.7} />
      </mesh>

      {/* last-move tint */}
      {isLast && <Tint opacity={0.16} y={0.001} />}
      {/* selection tint */}
      {isSelected && <Tint opacity={0.32} y={0.002} />}

      {/* legal-move markers — ignore raycast so clicks reach the tile/piece below */}
      {isTarget &&
        (cell ? (
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[0.4, 0.48, 28]} />
            <meshBasicMaterial color={palette.accent} transparent opacity={0.85} />
          </mesh>
        ) : (
          <mesh position={[0, 0.02, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.14, 0.14, 0.04, 20]} />
            <meshBasicMaterial color={palette.accent} transparent opacity={0.8} />
          </mesh>
        ))}

      {/* piece */}
      {cell && (
        <group onClick={select}>
          <Piece type={cell.type} color={cell.color} />
        </group>
      )}
    </group>
  );
}

function Tint({ opacity, y }: { opacity: number; y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={palette.accent} transparent opacity={opacity} />
    </mesh>
  );
}
