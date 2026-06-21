import * as THREE from "three";
import { BACKBOARD, COURT, HOOP, palette } from "../config";

/** Static court visuals: floor, backboard, rim, net, pole. */
export function Court() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[COURT.halfWidth * 2, COURT.frontZ - COURT.backZ]} />
        <meshStandardMaterial color={palette.court} roughness={0.9} />
      </mesh>

      <mesh position={[HOOP.x, BACKBOARD.y, BACKBOARD.z]} castShadow>
        <boxGeometry args={[BACKBOARD.halfWidth * 2, BACKBOARD.halfHeight * 2, 0.06]} />
        <meshStandardMaterial color={palette.board} />
      </mesh>

      <mesh position={[HOOP.x, HOOP.y, HOOP.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[HOOP.rimInner, 0.03, 12, 28]} />
        <meshStandardMaterial color={palette.rim} />
      </mesh>

      <mesh position={[HOOP.x, HOOP.y - 0.22, HOOP.z]}>
        <coneGeometry args={[HOOP.rimInner, 0.44, 16, 1, true]} />
        <meshStandardMaterial color={palette.net} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[HOOP.x, BACKBOARD.y / 2, BACKBOARD.z - 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, BACKBOARD.y, 12]} />
        <meshStandardMaterial color="#3a3f47" />
      </mesh>
    </group>
  );
}
