import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Court } from "./Court";
import type { BasketballGame } from "../domain/BasketballGame";
import { HOOP, SHOT, palette } from "../config";
import { clamp, lerp } from "@/shared/math";

export function Scene({ game }: { game: BasketballGame }) {
  const ball = useRef<THREE.Mesh>(null);
  const target = useRef<THREE.Mesh>(null);
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    game.aimYaw = clamp(pointer.x, -1, 1) * SHOT.maxYaw;
    game.aimPower = lerp(SHOT.basePower, SHOT.maxPower, clamp((pointer.y + 1) / 2, 0, 1));
    game.update(Math.min(delta, 1 / 30));

    ball.current?.position.set(game.pos.x, game.pos.y, game.pos.z);
    if (target.current) {
      const landing = game.predictedLanding();
      target.current.position.set(landing.x, 0.02, landing.z);
      target.current.visible = game.phase === "aiming";
    }
    camera.lookAt(0, 2, -3.5);
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 8, 4]} intensity={1} castShadow />

      <Court />

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[HOOP.ballRadius, 24, 18]} />
        <meshStandardMaterial color={palette.ball} roughness={0.6} />
      </mesh>

      <mesh ref={target} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.36, 28]} />
        <meshBasicMaterial color={palette.target} transparent opacity={0.7} />
      </mesh>
    </>
  );
}
