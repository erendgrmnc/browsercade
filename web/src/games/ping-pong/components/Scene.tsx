import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Table } from "./Table";
import type { PingPongGame } from "../domain/PingPongGame";
import { BALL, PADDLE, TABLE, palette } from "../config";

/**
 * Drives the simulation and renders it. The per-frame loop reads the headless
 * game state and writes it to mesh refs imperatively, so gameplay never triggers
 * a React re-render.
 */
export function Scene({ game }: { game: PingPongGame }) {
  const ball = useRef<THREE.Mesh>(null);
  const playerPaddle = useRef<THREE.Mesh>(null);
  const aiPaddle = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    game.playerTargetX = pointer.x * TABLE.halfWidth;
    game.update(Math.min(delta, 1 / 30)); // cap dt so a slow frame can't tunnel the ball

    ball.current?.position.set(game.ballX, game.ballY, game.ballZ);
    if (playerPaddle.current) playerPaddle.current.position.x = game.playerX;
    if (aiPaddle.current) aiPaddle.current.position.x = game.aiX;
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 6, 4]} intensity={1} castShadow />

      <Table />

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL.radius, 20, 16]} />
        <meshStandardMaterial color={palette.ball} roughness={0.4} />
      </mesh>

      <mesh ref={playerPaddle} position={[0, PADDLE.height / 2, PADDLE.playerZ]} castShadow>
        <boxGeometry args={[PADDLE.halfWidth * 2, PADDLE.height, PADDLE.thickness]} />
        <meshStandardMaterial color={palette.playerPaddle} roughness={0.4} />
      </mesh>

      <mesh ref={aiPaddle} position={[0, PADDLE.height / 2, PADDLE.aiZ]} castShadow>
        <boxGeometry args={[PADDLE.halfWidth * 2, PADDLE.height, PADDLE.thickness]} />
        <meshStandardMaterial color={palette.aiPaddle} roughness={0.4} />
      </mesh>
    </>
  );
}
