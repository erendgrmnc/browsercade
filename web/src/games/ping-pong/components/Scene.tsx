import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Table } from "./Table";
import { Paddle } from "./Paddle";
import type { PingPongGame } from "../domain/PingPongGame";
import { BALL, PADDLE, palette } from "../config";
import { clamp } from "@/shared/math";

export function Scene({ game }: { game: PingPongGame }) {
  const ball = useRef<THREE.Mesh>(null);
  const playerPaddle = useRef<THREE.Group>(null);
  const aiPaddle = useRef<THREE.Group>(null);
  const landing = useRef<THREE.Mesh>(null);
  const lookTarget = useRef(new THREE.Vector3(0, 0.28, -0.5));
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    // Mouse X slides the racket left/right (and, via yaw, aims the shot);
    // mouse Y slides it forward/back — pushing forward fast = a harder return.
    game.playerTargetX = pointer.x * PADDLE.xRange;
    game.playerTargetZ = PADDLE.playerBaseZ - clamp(pointer.y, -1, 1) * PADDLE.zForward;
    game.update(Math.min(delta, 1 / 30));

    ball.current?.position.set(game.pos.x, game.pos.y, game.pos.z);
    if (playerPaddle.current) {
      playerPaddle.current.position.set(game.playerX, game.playerY, game.playerZ);
      // Roll bound to lateral position — the round blade keeps facing the net,
      // the handle swings to the side like a clock hand.
      playerPaddle.current.rotation.z = game.racketRoll;
    }
    if (aiPaddle.current) aiPaddle.current.position.x = game.aiX;

    // Landing marker: where the ball will next bounce — slide your racket there.
    if (landing.current) {
      const spot = game.predictBounce();
      landing.current.visible = !!spot;
      if (spot) landing.current.position.set(spot.x, 0.014, spot.z);
    }

    // Camera gently tracks the ball so depth/landing read clearly.
    const tx = clamp(game.pos.x * 0.5, -0.8, 0.8);
    const tz = clamp(game.pos.z * 0.4, -1, 1) - 0.3;
    lookTarget.current.x += (tx - lookTarget.current.x) * 0.06;
    lookTarget.current.z += (tz - lookTarget.current.z) * 0.06;
    camera.lookAt(lookTarget.current.x, 0.28, lookTarget.current.z);
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

      <group ref={playerPaddle} position={[0, PADDLE.hoverY, PADDLE.playerBaseZ]}>
        <Paddle blade={palette.playerBlade} />
      </group>
      <group ref={aiPaddle} position={[0, PADDLE.hoverY, PADDLE.aiZ]} rotation={[0, Math.PI, 0]}>
        <Paddle blade={palette.aiBlade} />
      </group>

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL.radius, 20, 16]} />
        <meshStandardMaterial color={palette.ball} roughness={0.35} />
      </mesh>

      {/* predicted next-bounce ring on the table */}
      <mesh ref={landing} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.07, 0.1, 28]} />
        <meshBasicMaterial color={palette.landing} transparent opacity={0.85} />
      </mesh>
    </>
  );
}
