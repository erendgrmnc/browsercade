import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PoolTable } from "./PoolTable";
import type { PoolGame } from "../domain/PoolGame";
import { TABLE, palette } from "../config";

export function Scene({ game }: { game: PoolGame }) {
  const balls = useRef<(THREE.Mesh | null)[]>([]);
  const aimLine = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    game.update(Math.min(delta, 1 / 30));
    syncBalls(game, balls.current);
    syncAimLine(game, aimLine.current);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => game.setAim(e.point.x, e.point.z);
  const onDown = () => game.strike();

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[1, 7, 3]} intensity={1} castShadow />

      <PoolTable />

      {/* invisible plane that turns pointer position into a table-space aim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} onPointerMove={onMove} onPointerDown={onDown}>
        <planeGeometry args={[TABLE.halfWidth * 2 + 1, TABLE.halfLength * 2 + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {game.balls.map((ball, i) => (
        <mesh key={i} ref={(el) => (balls.current[i] = el)} castShadow>
          <sphereGeometry args={[ball.radius, 22, 16]} />
          <meshStandardMaterial color={ball.color} roughness={0.35} metalness={0.05} />
        </mesh>
      ))}

      <mesh ref={aimLine}>
        <boxGeometry args={[1, 0.012, 0.02]} />
        <meshBasicMaterial color={palette.aim} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

function syncBalls(game: PoolGame, meshes: (THREE.Mesh | null)[]): void {
  game.balls.forEach((ball, i) => {
    const mesh = meshes[i];
    if (!mesh) return;
    mesh.visible = !ball.pocketed;
    mesh.position.set(ball.x, ball.radius, ball.z);
  });
}

function syncAimLine(game: PoolGame, line: THREE.Mesh | null): void {
  if (!line) return;
  const cue = game.cue;
  const visible = game.phase === "aiming" && !cue.pocketed;
  line.visible = visible;
  if (!visible) return;

  const dx = game.aimX - cue.x;
  const dz = game.aimZ - cue.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  line.position.set(cue.x + dx / 2, cue.radius, cue.z + dz / 2);
  line.rotation.y = -Math.atan2(dz, dx);
  line.scale.x = dist;
}
