import { PADDLE, palette } from "../config";

/**
 * A table-tennis paddle: a round rubber blade whose faces point along Z (toward
 * the net), with a handle attached at the bottom of the blade and angled back
 * toward the player. Everything sits above the table — the group is mounted at
 * PADDLE.hoverY and nothing reaches below y=0.
 */
export function Paddle({ blade }: { blade: string }) {
  const r = PADDLE.bladeRadius;

  return (
    <group>
      {/* blade front (rubber) — a thin disc, faces along ±Z */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.05, 36]} />
        <meshStandardMaterial color={blade} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* back face — darker rubber so the two sides read differently */}
      <mesh position={[0, 0, -0.026]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.99, r * 0.99, 0.006, 36]} />
        <meshStandardMaterial color={palette.rubberBack} roughness={0.7} />
      </mesh>

      {/* handle — from the bottom of the blade, raked gently back toward the player.
          Stays above the table; with the paddle's roll it swings to the side. */}
      <group position={[0, -(r - 0.02), 0]} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.034, 0.15, 16]} />
          <meshStandardMaterial color={palette.handle} roughness={0.6} />
        </mesh>
        {/* grip end cap */}
        <mesh position={[0, -0.155, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.035, 16]} />
          <meshStandardMaterial color={palette.handleGrip} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
