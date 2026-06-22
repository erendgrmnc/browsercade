import * as THREE from "three";
import { BACKBOARD, COURT, HOOP, SHOT, palette } from "../config";

const LANE_FRONT = SHOT.spawnZ; // free-throw line (where the ball sits)
const LANE_BACK = BACKBOARD.z; // baseline under the hoop
const LANE_HALF = 1.95; // half-width of the painted key

/** A flat painted line lying on the floor. */
function Line({
  w,
  l,
  x = 0,
  z = 0,
  color = palette.line,
}: {
  w: number;
  l: number;
  x?: number;
  z?: number;
  color?: string;
}) {
  return (
    <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, l]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

/** Court visuals: floor, painted key + lines, backboard, rim, net, stanchion. */
export function Court() {
  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[COURT.halfWidth * 2, COURT.frontZ - COURT.backZ]} />
        <meshStandardMaterial color={palette.court} roughness={0.95} metalness={0} />
      </mesh>

      {/* Painted key (the lane) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, (LANE_FRONT + LANE_BACK) / 2]}>
        <planeGeometry args={[LANE_HALF * 2, LANE_FRONT - LANE_BACK]} />
        <meshStandardMaterial color={palette.paint} roughness={0.9} />
      </mesh>

      {/* Key outline + free-throw line */}
      <Line w={LANE_HALF * 2 + 0.06} l={0.06} z={LANE_FRONT} />
      <Line w={LANE_HALF * 2 + 0.06} l={0.06} z={LANE_BACK} />
      <Line w={0.06} l={LANE_FRONT - LANE_BACK} x={-LANE_HALF} z={(LANE_FRONT + LANE_BACK) / 2} />
      <Line w={0.06} l={LANE_FRONT - LANE_BACK} x={LANE_HALF} z={(LANE_FRONT + LANE_BACK) / 2} />
      {/* Free-throw semicircle hint */}
      <mesh position={[0, 0.012, LANE_FRONT]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[LANE_HALF - 0.05, LANE_HALF + 0.01, 40, 1, 0, Math.PI]} />
        <meshBasicMaterial color={palette.line} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Backboard: frame + board + shooter's square */}
      <group position={[HOOP.x, BACKBOARD.y, BACKBOARD.z]}>
        <mesh castShadow>
          <boxGeometry args={[BACKBOARD.halfWidth * 2 + 0.1, BACKBOARD.halfHeight * 2 + 0.1, 0.05]} />
          <meshStandardMaterial color="#1d2733" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[BACKBOARD.halfWidth * 2, BACKBOARD.halfHeight * 2, 0.04]} />
          <meshStandardMaterial color={palette.board} roughness={0.25} metalness={0.05} transparent opacity={0.92} />
        </mesh>
        {/* shooter's square, centred just above the rim */}
        <SquareOutline y={-0.16} half={0.26} thickness={0.025} z={0.07} color={palette.rim} />
      </group>

      {/* Rim + connector */}
      <mesh position={[HOOP.x, HOOP.y, HOOP.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[HOOP.rimInner, 0.022, 16, 32]} />
        <meshStandardMaterial color={palette.rim} metalness={0.5} roughness={0.35} emissive={palette.rim} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[HOOP.x, HOOP.y, (HOOP.z + BACKBOARD.z) / 2]}>
        <boxGeometry args={[0.06, 0.05, BACKBOARD.z - HOOP.z]} />
        <meshStandardMaterial color={palette.rim} metalness={0.5} roughness={0.4} />
      </mesh>

      <Net />

      {/* Stanchion behind the board */}
      <mesh position={[HOOP.x, BACKBOARD.y / 2, BACKBOARD.z - 0.35]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, BACKBOARD.y, 16]} />
        <meshStandardMaterial color="#2a2f37" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[HOOP.x, 0.06, BACKBOARD.z - 0.35]} receiveShadow>
        <boxGeometry args={[1.1, 0.12, 0.8]} />
        <meshStandardMaterial color="#23272e" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A hanging net: a ring of vertical strands tapering inwards. */
function Net() {
  const strands = 16;
  const top = HOOP.rimInner * 0.96;
  const bottom = HOOP.rimInner * 0.5;
  const depth = 0.42;
  return (
    <group position={[HOOP.x, HOOP.y, HOOP.z]}>
      {Array.from({ length: strands }).map((_, i) => {
        const a = (i / strands) * Math.PI * 2;
        const tx = Math.cos(a) * top;
        const tz = Math.sin(a) * top;
        const bx = Math.cos(a) * bottom;
        const bz = Math.sin(a) * bottom;
        const mid = new THREE.Vector3((tx + bx) / 2, -depth / 2, (tz + bz) / 2);
        const len = Math.hypot(tx - bx, depth, tz - bz);
        const dir = new THREE.Vector3(bx - tx, -depth, bz - tz).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.004, 0.004, len, 4]} />
            <meshBasicMaterial color={palette.net} transparent opacity={0.55} />
          </mesh>
        );
      })}
      {/* a couple of hoops to suggest the woven net */}
      <mesh position={[0, -depth * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[(top + bottom) / 2, 0.005, 8, 24]} />
        <meshBasicMaterial color={palette.net} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

/** Four thin bars forming a square outline (for the backboard target). */
function SquareOutline({ y, half, thickness, z, color }: { y: number; half: number; thickness: number; z: number; color: string }) {
  const bar = (px: number, py: number, w: number, h: number) => (
    <mesh position={[px, py, z]}>
      <boxGeometry args={[w, h, 0.02]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  );
  return (
    <group position={[0, y, 0]}>
      {bar(0, half, half * 2 + thickness, thickness)}
      {bar(0, -half, half * 2 + thickness, thickness)}
      {bar(-half, 0, thickness, half * 2)}
      {bar(half, 0, thickness, half * 2)}
    </group>
  );
}
