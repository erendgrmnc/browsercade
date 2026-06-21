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
      {/* handle */}
      <mesh position={[0, -PADDLE.bladeRadius - 0.075, 0.02]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.055, 0.17, 0.035]} />
        <meshStandardMaterial color={palette.handle} roughness={0.6} />
      </mesh>
    </group>
  );
}
