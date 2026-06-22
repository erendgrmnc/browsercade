import { POCKET, TABLE, palette } from "../config";

const w = TABLE.halfWidth;
const l = TABLE.halfLength;
const mC = POCKET.mouthCorner; // corner pocket mouth half-width
const mS = POCKET.mouthSide; // side pocket mouth half-width

const RAIL_W = 0.2;
const RAIL_H = 0.14;
const CUSHION_T = 0.085;
const CUSHION_H = 0.075;
const CUSHION_Y = 0.0375;

const pockets = [
  { x: -w, z: -l, r: POCKET.mouthCorner },
  { x: w, z: -l, r: POCKET.mouthCorner },
  { x: -w, z: l, r: POCKET.mouthCorner },
  { x: w, z: l, r: POCKET.mouthCorner },
  { x: -w, z: 0, r: POCKET.mouthSide },
  { x: w, z: 0, r: POCKET.mouthSide },
];

/** Static table visuals: cloth, wooden frame, cushions (with pocket gaps), pockets. */
export function PoolTable() {
  return (
    <group>
      {/* Cloth playing surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[w * 2, l * 2]} />
        <meshStandardMaterial color={palette.cloth} roughness={0.96} metalness={0} />
      </mesh>

      {/* Wooden outer frame (four mitred blocks) */}
      <Frame x={0} z={l + RAIL_W / 2} lenX={w * 2 + RAIL_W * 2} lenZ={RAIL_W} />
      <Frame x={0} z={-l - RAIL_W / 2} lenX={w * 2 + RAIL_W * 2} lenZ={RAIL_W} />
      <Frame x={w + RAIL_W / 2} z={0} lenX={RAIL_W} lenZ={l * 2} />
      <Frame x={-w - RAIL_W / 2} z={0} lenX={RAIL_W} lenZ={l * 2} />

      {/* Cushions on the long rails (x = ±w), split around the side pocket */}
      {([w, -w] as const).map((sx) =>
        ([1, -1] as const).map((sz) => {
          const z0 = mS;
          const z1 = l - mC;
          return (
            <Cushion
              key={`long-${sx}-${sz}`}
              x={sx - Math.sign(sx) * CUSHION_T / 2}
              z={(sz * (z0 + z1)) / 2}
              lenX={CUSHION_T}
              lenZ={z1 - z0}
            />
          );
        }),
      )}

      {/* Cushions on the short rails (z = ±l) */}
      {([l, -l] as const).map((sz) => (
        <Cushion
          key={`short-${sz}`}
          x={0}
          z={sz - Math.sign(sz) * CUSHION_T / 2}
          lenX={(w - mC) * 2}
          lenZ={CUSHION_T}
        />
      ))}

      {/* Pockets */}
      {pockets.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[p.r, 28]} />
            <meshBasicMaterial color={palette.pocket} />
          </mesh>
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.r, p.r + 0.03, 28]} />
            <meshStandardMaterial color={palette.pocketRim} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Frame({ x, z, lenX, lenZ }: { x: number; z: number; lenX: number; lenZ: number }) {
  return (
    <mesh position={[x, RAIL_H / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[lenX, RAIL_H, lenZ]} />
      <meshStandardMaterial color={palette.rail} roughness={0.65} metalness={0.05} />
    </mesh>
  );
}

function Cushion({ x, z, lenX, lenZ }: { x: number; z: number; lenX: number; lenZ: number }) {
  return (
    <mesh position={[x, CUSHION_Y, z]} castShadow>
      <boxGeometry args={[lenX, CUSHION_H, lenZ]} />
      <meshStandardMaterial color={palette.clothLine} roughness={0.9} />
    </mesh>
  );
}
