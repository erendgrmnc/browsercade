import { PADDLE, palette } from "../config";

/** A table-tennis paddle: a thin round blade (facing the net) on a wooden handle. */
export function Paddle({ blade }: { blade: string }) {
  return (
    <group>
      {/* blade — a thin disc whose faces point along Z (toward the net) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[PADDLE.bladeRadius, PADDLE.bladeRadius, 0.04, 30]} />
        <meshStandardMaterial color={blade} roughness={0.55} />
      </mesh>
      {/* edge rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PADDLE.bladeRadius, 0.012, 8, 30]} />
        <meshStandardMaterial color={palette.rubberBack} roughness={0.7} />
      </mesh>
      {/* handle — extends back toward the player (along +Z) and slightly down, so
          it never dips through the table */}
      <mesh position={[0, -PADDLE.bladeRadius * 0.55, 0.13]} rotation={[Math.PI / 2 + 0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.18, 0.035]} />
        <meshStandardMaterial color={palette.handle} roughness={0.6} />
      </mesh>
    </group>
  );
}
