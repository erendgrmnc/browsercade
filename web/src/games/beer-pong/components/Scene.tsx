import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BeerPongGame, Cup } from "../domain/BeerPongGame";
import { CUP, TABLE, THROW, palette } from "../config";
import { clamp, lerp } from "@/shared/math";

export function Scene({
  game,
  cups,
  simulate = true,
  aimable = true,
  onFrame,
}: {
  game: BeerPongGame;
  cups: Cup[];
  /** Advance the local simulation each frame (false when the opponent is throwing online). */
  simulate?: boolean;
  /** Take aim from the pointer + show the target ring (false on the opponent's turn). */
  aimable?: boolean;
  /** Called every frame after sync (online: stream ball/cup state while in flight). */
  onFrame?: () => void;
}) {
  const ball = useRef<THREE.Mesh>(null);
  const target = useRef<THREE.Mesh>(null);
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    if (aimable) {
      game.aimYaw = clamp(pointer.x, -1, 1) * THROW.maxYaw;
      game.aimPower = lerp(THROW.basePower, THROW.maxPower, clamp((pointer.y + 1) / 2, 0, 1));
    }
    if (simulate) game.update(Math.min(delta, 1 / 30));

    ball.current?.position.set(game.pos.x, game.pos.y, game.pos.z);
    if (target.current) {
      const landing = game.predictedLanding();
      target.current.position.set(landing.x, 0.02, landing.z);
      target.current.visible = aimable && game.phase === "aiming";
    }
    camera.lookAt(0, 0.4, -2.5);
    onFrame?.();
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 6, 4]} intensity={1} castShadow />

      <mesh receiveShadow position={[0, -0.05, (TABLE.frontZ + TABLE.backZ) / 2]}>
        <boxGeometry args={[TABLE.halfWidth * 2, 0.1, TABLE.frontZ - TABLE.backZ]} />
        <meshStandardMaterial color={palette.table} roughness={0.8} />
      </mesh>

      {cups.map((cup) =>
        cup.active ? (
          <mesh key={`${cup.x},${cup.z}`} position={[cup.x, CUP.height / 2, cup.z]} castShadow>
            <cylinderGeometry args={[CUP.radius, CUP.radius * 0.8, CUP.height, 16, 1, true]} />
            <meshStandardMaterial color={palette.cup} side={THREE.DoubleSide} roughness={0.5} />
          </mesh>
        ) : null,
      )}

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[THROW.ballRadius, 18, 14]} />
        <meshStandardMaterial color={palette.ball} roughness={0.5} />
      </mesh>

      <mesh ref={target} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 24]} />
        <meshBasicMaterial color={palette.target} transparent opacity={0.7} />
      </mesh>
    </>
  );
}
