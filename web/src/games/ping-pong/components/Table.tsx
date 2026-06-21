import { TABLE, palette } from "../config";

/** Static table visuals: surface, net, and centre line. */
export function Table() {
  const width = TABLE.halfWidth * 2;
  const length = TABLE.halfLength * 2;

  return (
    <group>
      <mesh receiveShadow position={[0, -TABLE.thickness / 2, 0]}>
        <boxGeometry args={[width, TABLE.thickness, length]} />
        <meshStandardMaterial color={palette.table} roughness={0.6} />
      </mesh>

      {/* net at the centre line */}
      <mesh position={[0, TABLE.netHeight / 2, 0]}>
        <boxGeometry args={[width + 0.12, TABLE.netHeight, 0.02]} />
        <meshStandardMaterial color={palette.net} transparent opacity={0.6} />
      </mesh>

      {/* centre line down the length of the table */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, length]} />
        <meshBasicMaterial color={palette.tableLine} />
      </mesh>
    </group>
  );
}
