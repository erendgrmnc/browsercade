import { PADDLE, palette } from "../config";

/** A table-tennis paddle: a thin round blade with a handle below it. */
export function Paddle({ blade }: { blade: string }) {
  return (
    <group>
      {/* blade — a thin disc whose faces point along Z (toward the net) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[PADDLE.bladeRadius, PADDLE.bladeRadius, 0.04, 30]} />
        <meshStandardMaterial color={blade} roughness={0.55} />
      </mesh>
      {/* handle — comes off the bottom of the blade and angles back toward the
          player (along +Z), staying above the table surface */}
      <mesh position={[0, -PADDLE.bladeRadius * 0.7, 0.1]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.04, 0.18]} />
        <meshStandardMaterial color={palette.handle} roughness={0.6} />
      </mesh>
    </group>
  );
}
