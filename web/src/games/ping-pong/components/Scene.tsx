import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Table } from "./Table";
import { Paddle } from "./Paddle";
import type { PingPongGame } from "../domain/PingPongGame";
import { BALL, PADDLE, TABLE, palette } from "../config";
import { clamp } from "@/shared/math";

export function Scene({ game }: { game: PingPongGame }) {
  const ball = useRef<THREE.Mesh>(null);
  const playerPaddle = useRef<THREE.Group>(null);
  const aiPaddle = useRef<THREE.Group>(null);
  const charge = useRef<THREE.Mesh>(null);
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    game.playerTargetX = pointer.x * (TABLE.halfWidth + 0.15);
    game.aimDepth = clamp(pointer.y, -1, 1);
    game.update(Math.min(delta, 1 / 30));

    ball.current?.position.set(game.pos.x, game.pos.y, game.pos.z);
    if (playerPaddle.current) playerPaddle.current.position.x = game.playerX;
    if (aiPaddle.current) aiPaddle.current.position.x = game.aiX;

    if (charge.current) {
      const show = game.charging && game.charge > 0.02;
      charge.current.visible = show;
      if (show) {
        charge.current.position.set(game.playerX, 0.01, PADDLE.playerZ);
        const s = 0.5 + game.charge;
        charge.current.scale.set(s, s, s);
      }
    }

    camera.lookAt(0, 0.28, -0.5);
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 7, 5]}
        intensity={1.05}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Table />

      <group ref={playerPaddle} position={[0, PADDLE.hoverY, PADDLE.playerZ]}>
        <Paddle blade={palette.playerBlade} />
      </group>
      <group ref={aiPaddle} position={[0, PADDLE.hoverY, PADDLE.aiZ]} rotation={[0, Math.PI, 0]}>
        <Paddle blade={palette.aiBlade} />
      </group>

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL.radius, 20, 16]} />
        <meshStandardMaterial color={palette.ball} roughness={0.35} />
      </mesh>

      {/* charge ring under the player's paddle (scales with power) */}
      <mesh ref={charge} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.16, 0.22, 28]} />
        <meshBasicMaterial color={palette.charge} transparent opacity={0.8} />
      </mesh>
    </>
  );
}
