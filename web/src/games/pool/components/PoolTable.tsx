import { POCKET, TABLE, palette } from "../config";

/** Static table visuals: cloth, rail frame, and pocket holes. */
export function PoolTable() {
  const w = TABLE.halfWidth;
  const l = TABLE.halfLength;
  const pockets = [
    { x: -w, z: -l }, { x: w, z: -l },
    { x: -w, z: l }, { x: w, z: l },
    { x: -w, z: 0 }, { x: w, z: 0 },
  ];

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 2, l * 2]} />
        <meshStandardMaterial color={palette.cloth} roughness={0.95} />
      </mesh>

      <Rail x={0} z={l} lenX={w * 2 + 0.2} lenZ={0.12} />
      <Rail x={0} z={-l} lenX={w * 2 + 0.2} lenZ={0.12} />
      <Rail x={w} z={0} lenX={0.12} lenZ={l * 2} />
      <Rail x={-w} z={0} lenX={0.12} lenZ={l * 2} />

      {pockets.map((p, i) => (
        <mesh key={i} position={[p.x, 0.01, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[POCKET.radius, 20]} />
          <meshBasicMaterial color={palette.pocket} />
        </mesh>
      ))}
    </group>
  );
}

function Rail({ x, z, lenX, lenZ }: { x: number; z: number; lenX: number; lenZ: number }) {
  return (
    <mesh position={[x, 0.06, z]} castShadow>
      <boxGeometry args={[lenX, 0.12, lenZ]} />
      <meshStandardMaterial color={palette.rail} roughness={0.7} />
    </mesh>
  );
}
