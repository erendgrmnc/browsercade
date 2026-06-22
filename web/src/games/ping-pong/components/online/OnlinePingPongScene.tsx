import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Table } from "../Table";
import { Paddle } from "../Paddle";
import type { PingPongGame } from "../../domain/PingPongGame";
import type { PingPongMessage } from "../../domain/online/messages";
import { BALL, PADDLE, palette } from "../../config";
import { clamp } from "@/shared/math";

type Props = {
  game: PingPongGame;
  isHost: boolean;
  guestInputXRef: { current: number };
  broadcastState: () => void;
  snapshotRef: { current: PingPongMessage | null };
  sendInput: (x: number) => void;
};

export function OnlinePingPongScene({
  game,
  isHost,
  guestInputXRef,
  broadcastState,
  snapshotRef,
  sendInput,
}: Props) {
  const ball = useRef<THREE.Mesh>(null);
  const playerPaddle = useRef<THREE.Group>(null);
  const aiPaddle = useRef<THREE.Group>(null);
  const lookTarget = useRef(new THREE.Vector3(0, 0.28, isHost ? -0.5 : 0.5));
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    if (isHost) {
      // Host runs the authoritative simulation.
      game.playerTargetX = pointer.x * PADDLE.xRange;
      game.playerTargetZ = PADDLE.playerBaseZ - clamp(pointer.y, -1, 1) * PADDLE.zForward;
      game.aiTargetX = guestInputXRef.current; // remote opponent drives the far paddle
      game.update(Math.min(delta, 1 / 30));
    } else {
      // Guest renders the host's snapshot.
      const snap = snapshotRef.current;
      if (snap) applySnapshot(game, snap);
    }

    // Render ball + the host (near) paddle from the game state.
    ball.current?.position.set(game.pos.x, game.pos.y, game.pos.z);
    if (playerPaddle.current) {
      playerPaddle.current.position.set(game.playerX, game.playerY, game.playerZ);
      playerPaddle.current.rotation.z = game.racketRoll;
    }

    if (isHost) {
      if (aiPaddle.current) aiPaddle.current.position.x = game.aiX;
      hostCamera(game, camera, lookTarget.current);
      broadcastState();
    } else {
      // The guest controls the far paddle. Their view is flipped 180°, so screen
      // right (pointer.x > 0) is world -X. Render it locally for instant feedback,
      // and send the world-space X to the host.
      const localX = clamp(-pointer.x, -1, 1) * PADDLE.xRange;
      if (aiPaddle.current) aiPaddle.current.position.x = localX;
      sendInput(localX);
      guestCamera(game, camera, lookTarget.current);
    }
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
    </>
  );
}

function applySnapshot(game: PingPongGame, s: PingPongMessage): void {
  if (s.kind !== "state") return;
  game.pos.x = s.bx;
  game.pos.y = s.by;
  game.pos.z = s.bz;
  game.playerX = s.px;
  game.playerZ = s.pz;
  game.racketRoll = s.roll;
  game.aiX = s.ax;
}

function hostCamera(game: PingPongGame, camera: THREE.Camera, look: THREE.Vector3): void {
  camera.position.set(0, 2.15, 5.2);
  const tx = clamp(game.pos.x * 0.5, -0.8, 0.8);
  const tz = clamp(game.pos.z * 0.4, -1, 1) - 0.3;
  look.x += (tx - look.x) * 0.06;
  look.z += (tz - look.z) * 0.06;
  camera.lookAt(look.x, 0.28, look.z);
}

function guestCamera(game: PingPongGame, camera: THREE.Camera, look: THREE.Vector3): void {
  // Mirror of the host view: sit behind the far paddle looking back up the table.
  camera.position.set(0, 2.15, -5.2);
  const tx = clamp(game.pos.x * 0.5, -0.8, 0.8);
  const tz = clamp(game.pos.z * 0.4, -1, 1) + 0.3;
  look.x += (tx - look.x) * 0.06;
  look.z += (tz - look.z) * 0.06;
  camera.lookAt(look.x, 0.28, look.z);
}
