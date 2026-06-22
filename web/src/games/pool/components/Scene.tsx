import { useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PoolTable } from "./PoolTable";
import type { PoolGame } from "../domain/PoolGame";
import { CAMERA, CUE, SHOT, TABLE, palette } from "../config";

/** Keep decorative meshes out of the pointer raycast so the aim plane always wins. */
const NO_RAYCAST = () => null;

export function Scene({
  game,
  simulate = true,
  aimable = true,
  onStrike,
  onFrame,
}: {
  game: PoolGame;
  /** Advance the local simulation each frame (false when the opponent is shooting online). */
  simulate?: boolean;
  /** Allow pointer aim + striking (false on the opponent's turn). */
  aimable?: boolean;
  /** Called instead of game.strike(power) on release (online: strike + start streaming). */
  onStrike?: (power: number) => void;
  /** Called every frame after sync (online: stream ball positions while shooting). */
  onFrame?: () => void;
}) {
  const balls = useRef<(THREE.Mesh | null)[]>([]);
  const cueStick = useRef<THREE.Group>(null);
  const aimLine = useRef<THREE.Mesh>(null);
  const powerBar = useRef<THREE.Group>(null);
  const powerFill = useRef<THREE.Mesh>(null);
  const charge = useRef({ active: false, power: 0 });

  const { camera } = useThree();
  const materials = useMemo(() => game.balls.map((b) => ballMaterial(b.number, b.color)), [game.balls]);

  useFrame((_, delta) => {
    camera.lookAt(CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]);
    if (simulate) game.update(Math.min(delta, 1 / 30));

    // Charge the shot while the pointer is held.
    if (charge.current.active) {
      charge.current.power = Math.min(1, charge.current.power + delta / SHOT.chargeSeconds);
    }

    syncBalls(game, balls.current);
    syncCueStick(game, cueStick.current, aimable, charge.current.power, charge.current.active);
    syncAimLine(game, aimLine.current, aimable);
    syncPowerBar(powerBar.current, powerFill.current, charge.current.active, charge.current.power, game);
    onFrame?.();
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (aimable && game.phase === "aiming") game.setAim(e.point.x, e.point.z);
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!aimable || game.phase !== "aiming") return;
    if (game.ballInHand) {
      game.placeCue(e.point.x, e.point.z);
      return;
    }
    charge.current = { active: true, power: 0 };
  };

  const onUp = () => {
    if (!charge.current.active) return;
    const power = charge.current.power;
    charge.current = { active: false, power: 0 };
    if (onStrike) onStrike(power);
    else game.strike(power);
  };

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[1.5, 8, 2.5]}
        intensity={1.05}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight position={[-2, 5, -3]} intensity={0.35} />

      <PoolTable />

      {/* invisible plane that turns pointer position into a table-space aim */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        onPointerMove={onMove}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <planeGeometry args={[TABLE.halfWidth * 2 + 2, TABLE.halfLength * 2 + 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {game.balls.map((ball, i) => (
        <mesh key={i} ref={(el) => (balls.current[i] = el)} castShadow material={materials[i]} raycast={NO_RAYCAST}>
          <sphereGeometry args={[ball.radius, 32, 24]} />
        </mesh>
      ))}

      {/* Cue stick — cylinders rotated 90° about Z so their axis lies along local X */}
      <group ref={cueStick}>
        <mesh position={[-CUE.length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow raycast={NO_RAYCAST}>
          <cylinderGeometry args={[CUE.buttRadius, CUE.tipRadius, CUE.length, 16]} />
          <meshStandardMaterial color={palette.cueWood} roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} raycast={NO_RAYCAST}>
          <cylinderGeometry args={[CUE.tipRadius, CUE.tipRadius, 0.04, 16]} />
          <meshStandardMaterial color={palette.cueTip} roughness={0.6} />
        </mesh>
      </group>

      {/* Thin aim guide */}
      <mesh ref={aimLine} raycast={NO_RAYCAST}>
        <boxGeometry args={[1, 0.01, 0.012]} />
        <meshBasicMaterial color={palette.aim} transparent opacity={0.45} />
      </mesh>

      {/* Power meter, floats beside the cue ball while charging */}
      <group ref={powerBar} visible={false}>
        <mesh raycast={NO_RAYCAST}>
          <boxGeometry args={[0.5, 0.05, 0.02]} />
          <meshBasicMaterial color="#1b2430" />
        </mesh>
        <mesh ref={powerFill} position={[0, 0, 0.001]} raycast={NO_RAYCAST}>
          <boxGeometry args={[0.5, 0.05, 0.025]} />
          <meshBasicMaterial color="#ffd24a" />
        </mesh>
      </group>
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

function syncCueStick(
  game: PoolGame,
  group: THREE.Group | null,
  aimable: boolean,
  power: number,
  charging: boolean,
): void {
  if (!group) return;
  const cue = game.cue;
  const visible = aimable && game.phase === "aiming" && !cue.pocketed && !game.ballInHand;
  group.visible = visible;
  if (!visible) return;

  const dx = game.aimX - cue.x;
  const dz = game.aimZ - cue.z;
  const dist = Math.hypot(dx, dz) || 1;
  const dirX = dx / dist;
  const dirZ = dz / dist;

  // Tip sits behind the cue ball, pulled back further as the shot charges.
  const pull = cue.radius + CUE.gap + (charging ? CUE.pullback * power : 0);
  group.position.set(cue.x - dirX * pull, cue.radius, cue.z - dirZ * pull);
  group.rotation.y = -Math.atan2(dirZ, dirX);
}

function syncAimLine(game: PoolGame, line: THREE.Mesh | null, aimable = true): void {
  if (!line) return;
  const cue = game.cue;
  const visible = aimable && game.phase === "aiming" && !cue.pocketed && !game.ballInHand;
  line.visible = visible;
  if (!visible) return;

  const dx = game.aimX - cue.x;
  const dz = game.aimZ - cue.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  line.position.set(cue.x + dx / 2, cue.radius, cue.z + dz / 2);
  line.rotation.y = -Math.atan2(dz, dx);
  line.scale.x = dist;
}

function syncPowerBar(
  group: THREE.Group | null,
  fill: THREE.Mesh | null,
  charging: boolean,
  power: number,
  game: PoolGame,
): void {
  if (!group || !fill) return;
  group.visible = charging;
  if (!charging) return;
  const cue = game.cue;
  group.position.set(cue.x, 0.35, cue.z);
  group.rotation.y = -Math.PI / 4;
  fill.scale.x = Math.max(0.001, power);
  fill.position.x = -0.25 * (1 - power); // grow from the left edge
}

// ---- numbered / striped ball textures --------------------------------------

const textureCache = new Map<number, THREE.CanvasTexture>();

function ballMaterial(number: number, color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: ballTexture(number, color),
    roughness: 0.25,
    metalness: 0.05,
  });
}

function ballTexture(number: number, color: string): THREE.CanvasTexture {
  const cached = textureCache.get(number);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const isStripe = number >= 9;
  const isCue = number === 0;

  if (isCue) {
    ctx.fillStyle = palette.cue;
    ctx.fillRect(0, 0, size, size);
  } else if (isStripe) {
    ctx.fillStyle = "#f4f1e6";
    ctx.fillRect(0, 0, size, size);
    // A bold equatorial band, wide enough to read from an angled view.
    ctx.fillStyle = color;
    ctx.fillRect(0, size * 0.27, size, size * 0.46);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
  }

  if (!isCue) {
    // Two number badges (front + back) so a number shows whichever way it sits.
    for (const cx of [size * 0.25, size * 0.75]) {
      ctx.fillStyle = "#f4f1e6";
      ctx.beginPath();
      ctx.arc(cx, size / 2, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#11161d";
      ctx.font = `bold ${size * 0.17}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(number), cx, size / 2 + 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  textureCache.set(number, texture);
  return texture;
}
