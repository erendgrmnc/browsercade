/**
 * Stylized geometric chess pieces, composed from primitives (no model assets).
 * Each type has a distinct silhouette/height so it reads at a glance. Swap this
 * file for glTF models later without touching the board or game logic.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { palette } from "@/games/chess/theme";
import type { PieceColor, PieceType } from "@/games/chess/domain/chess/types";

export function Piece({ type, color }: { type: PieceType; color: PieceColor }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color === "w" ? palette.whitePiece : palette.blackPiece,
        roughness: 0.55,
        metalness: 0.12,
      }),
    [color],
  );

  return <group>{renderBody(type, material)}</group>;
}

function renderBody(type: PieceType, m: THREE.Material) {
  switch (type) {
    case "p":
      return (
        <>
          <mesh material={m} position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.32, 0.16, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.21, 0.2, 16]} />
          </mesh>
          <mesh material={m} position={[0, 0.47, 0]} castShadow>
            <sphereGeometry args={[0.18, 20, 16]} />
          </mesh>
        </>
      );
    case "r":
      return (
        <>
          <mesh material={m} position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, 0.18, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.26, 0.46, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.31, 0.26, 0.14, 20]} />
          </mesh>
        </>
      );
    case "n":
      return (
        <>
          <mesh material={m} position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, 0.18, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 0.3, 16]} />
          </mesh>
          {/* leaning "head" suggests a knight */}
          <mesh material={m} position={[0, 0.64, 0.06]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.4, 0.22]} />
          </mesh>
        </>
      );
    case "b":
      return (
        <>
          <mesh material={m} position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.27, 0.33, 0.18, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.46, 0]} castShadow>
            <coneGeometry args={[0.22, 0.56, 20]} />
          </mesh>
          <mesh material={m} position={[0, 0.76, 0]} castShadow>
            <sphereGeometry args={[0.13, 16, 14]} />
          </mesh>
        </>
      );
    case "q":
      return (
        <>
          <mesh material={m} position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.37, 0.2, 24]} />
          </mesh>
          <mesh material={m} position={[0, 0.52, 0]} castShadow>
            <coneGeometry args={[0.26, 0.66, 24]} />
          </mesh>
          <mesh material={m} position={[0, 0.86, 0]} castShadow>
            <sphereGeometry args={[0.19, 20, 16]} />
          </mesh>
          <mesh material={m} position={[0, 1.04, 0]} castShadow>
            <sphereGeometry args={[0.08, 14, 12]} />
          </mesh>
        </>
      );
    case "k":
      return (
        <>
          <mesh material={m} position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.37, 0.2, 24]} />
          </mesh>
          <mesh material={m} position={[0, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.64, 24]} />
          </mesh>
          <mesh material={m} position={[0, 0.9, 0]} castShadow>
            <sphereGeometry args={[0.18, 20, 16]} />
          </mesh>
          {/* crown cross */}
          <mesh material={m} position={[0, 1.16, 0]} castShadow>
            <boxGeometry args={[0.06, 0.24, 0.06]} />
          </mesh>
          <mesh material={m} position={[0, 1.14, 0]} castShadow>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
          </mesh>
        </>
      );
  }
}
