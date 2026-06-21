import { TABLE, palette } from "../config";

/** Table, white boundary + centre lines, net (with tape + posts), legs, floor. */
export function Table() {
  const w = TABLE.halfWidth;
  const l = TABLE.halfLength;
  const legs: [number, number][] = [
    [-(w - 0.2), -(l - 0.2)],
    [w - 0.2, -(l - 0.2)],
    [-(w - 0.2), l - 0.2],
    [w - 0.2, l - 0.2],
  ];

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.79, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color={palette.floor} roughness={1} />
      </mesh>

      <mesh receiveShadow position={[0, -TABLE.thickness / 2, 0]}>
        <boxGeometry args={[w * 2, TABLE.thickness, l * 2]} />
        <meshStandardMaterial color={palette.table} roughness={0.5} />
      </mesh>

      <Line x={0} z={l - 0.012} lenX={w * 2} lenZ={0.024} />
      <Line x={0} z={-(l - 0.012)} lenX={w * 2} lenZ={0.024} />
      <Line x={w - 0.012} z={0} lenX={0.024} lenZ={l * 2} />
      <Line x={-(w - 0.012)} z={0} lenX={0.024} lenZ={l * 2} />
      <Line x={0} z={0} lenX={0.016} lenZ={l * 2} />

      {/* net */}
      <mesh position={[0, TABLE.netHeight / 2, 0]}>
        <boxGeometry args={[w * 2 + 0.12, TABLE.netHeight, 0.012]} />
        <meshStandardMaterial color={palette.net} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, TABLE.netHeight, 0]}>
        <boxGeometry args={[w * 2 + 0.14, 0.018, 0.02]} />
        <meshStandardMaterial color={palette.netTape} />
      </mesh>
      {[w + 0.06, -(w + 0.06)].map((x) => (
        <mesh key={x} position={[x, TABLE.netHeight / 2, 0]}>
          <cylinderGeometry args={[0.018, 0.018, TABLE.netHeight, 10]} />
          <meshStandardMaterial color={palette.post} />
        </mesh>
      ))}

      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, -0.4, z]} castShadow>
          <boxGeometry args={[0.06, 0.78, 0.06]} />
          <meshStandardMaterial color={palette.leg} />
        </mesh>
      ))}
    </group>
  );
}

function Line({ x, z, lenX, lenZ }: { x: number; z: number; lenX: number; lenZ: number }) {
  return (
    <mesh position={[x, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[lenX, lenZ]} />
      <meshBasicMaterial color={palette.tableLine} />
    </mesh>
  );
}
