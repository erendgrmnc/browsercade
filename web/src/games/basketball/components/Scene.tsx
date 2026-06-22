import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Court } from "./Court";
import type { BasketballGame } from "../domain/BasketballGame";
import { AIM, HOOP, SHOT, palette } from "../config";

const UP = new THREE.Vector3(0, 1, 0);
const R = HOOP.ballRadius;

// Make-FX tuning.
const SHAKE_TIME = 0.4;
const SHAKE_AMP = 0.22;
const BURST_TIME = 0.7;
const PARTICLES = 14;

export function Scene({
  game,
  interactive = true,
  simulate = true,
  followBall = false,
  onFrame,
}: {
  game: BasketballGame;
  interactive?: boolean;
  simulate?: boolean;
  followBall?: boolean;
  onFrame?: () => void;
}) {
  const ballGroup = useRef<THREE.Group>(null);
  const arrow = useRef<THREE.Group>(null);
  const bar = useRef<THREE.Group>(null);
  const barFill = useRef<THREE.Mesh>(null);
  const barSweet = useRef<THREE.Mesh>(null);
  const barMarker = useRef<THREE.Group>(null);
  const camLook = useRef(new THREE.Vector3(0, 2.1, -1.0));
  const ring = useRef<THREE.Mesh>(null);
  const particles = useRef<THREE.Group>(null);
  const partState = useRef(
    Array.from({ length: PARTICLES }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3() })),
  );
  const prevPulse = useRef(0);
  const shake = useRef(0);
  const burst = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    if (simulate) game.update(dt);

    ballGroup.current?.position.set(game.pos.x, game.pos.y, game.pos.z);

    // Make FX: when a basket drops, shake the camera and pop a burst at the rim.
    if (game.makePulse > prevPulse.current) {
      prevPulse.current = game.makePulse;
      shake.current = SHAKE_TIME;
      triggerBurst(burst, partState.current, ring.current, particles.current);
    }
    if (shake.current > 0) shake.current = Math.max(0, shake.current - dt);
    updateBurst(dt, burst, partState.current, ring.current, particles.current);

    syncArrow(game, arrow.current, interactive);
    syncBar(game, bar.current, barFill.current, barSweet.current, barMarker.current, interactive, camera);
    followCamera(game, camera, camLook.current, followBall, SHAKE_AMP * (shake.current / SHAKE_TIME));

    onFrame?.();
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <fog attach="fog" args={[palette.floor, 12, 26]} />
      <hemisphereLight args={["#9fc3e6", "#0b0e14", 0.45]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 9, 5]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
      />
      <directionalLight position={[-5, 6, -2]} intensity={0.3} color="#88a6ff" />

      <Court />

      {/* Basketball with seam lines */}
      <group ref={ballGroup} castShadow>
        <mesh castShadow>
          <sphereGeometry args={[R, 32, 24]} />
          <meshStandardMaterial color={palette.ball} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R, 0.012, 8, 32]} />
          <meshStandardMaterial color={palette.ballLine} roughness={0.8} />
        </mesh>
        <mesh>
          <torusGeometry args={[R, 0.012, 8, 32]} />
          <meshStandardMaterial color={palette.ballLine} roughness={0.8} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[R, 0.012, 8, 32]} />
          <meshStandardMaterial color={palette.ballLine} roughness={0.8} />
        </mesh>
      </group>

      {/* Score burst — expanding ring + particles at the rim on a made basket. */}
      <mesh ref={ring} position={[HOOP.x, HOOP.y, HOOP.z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.26, 0.4, 36]} />
        <meshBasicMaterial color={palette.sweet} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <group ref={particles} position={[HOOP.x, HOOP.y, HOOP.z]} visible={false}>
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial
              color={i % 2 ? palette.ball : palette.sweet}
              emissive={i % 2 ? palette.ball : palette.sweet}
              emissiveIntensity={0.7}
              transparent
            />
          </mesh>
        ))}
      </group>

      {/* Aim arrow — emanates from the ball along the launch direction (the arc). */}
      <group ref={arrow}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.05, 0.8, 12]} />
          <meshStandardMaterial color={palette.arrow} emissive={palette.arrow} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <coneGeometry args={[0.13, 0.3, 16]} />
          <meshStandardMaterial color={palette.arrow} emissive={palette.arrow} emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Power bar (billboarded toward the camera) */}
      <group ref={bar}>
        <mesh>
          <boxGeometry args={[0.2, AIM.barHeight + 0.16, 0.04]} />
          <meshStandardMaterial color="#0c1118" metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[0.12, AIM.barHeight, 0.04]} />
          <meshStandardMaterial color="#1a2230" />
        </mesh>
        <mesh ref={barSweet} position={[0, 0, 0.03]}>
          <boxGeometry args={[0.18, AIM.sweetHalf * 2 * AIM.barHeight, 0.05]} />
          <meshStandardMaterial color={palette.sweet} emissive={palette.sweet} emissiveIntensity={0.7} />
        </mesh>
        <mesh ref={barFill} position={[0, 0, 0.035]}>
          <boxGeometry args={[0.12, AIM.barHeight, 0.05]} />
          <meshStandardMaterial color={palette.power} emissive={palette.power} emissiveIntensity={0.4} transparent opacity={0.85} />
        </mesh>
        <group ref={barMarker}>
          <mesh position={[-0.16, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.06, 0.12, 3]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0.16, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.06, 0.12, 3]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
          </mesh>
        </group>
      </group>
    </>
  );
}

function syncArrow(game: BasketballGame, group: THREE.Group | null, interactive: boolean): void {
  if (!group) return;
  const show = interactive && game.phase === "aiming";
  group.visible = show;
  if (!show) return;
  const d = game.aimDirection();
  // Anchor the tail at the ball's surface, pointing along the launch direction.
  group.position.set(game.pos.x + d.x * R, game.pos.y + d.y * R, game.pos.z + d.z * R);
  group.quaternion.setFromUnitVectors(UP, new THREE.Vector3(d.x, d.y, d.z));
}

function syncBar(
  game: BasketballGame,
  group: THREE.Group | null,
  fill: THREE.Mesh | null,
  sweet: THREE.Mesh | null,
  marker: THREE.Group | null,
  interactive: boolean,
  camera: THREE.Camera,
): void {
  if (!group) return;
  const show = interactive && game.phase === "aiming" && game.stage === "power";
  group.visible = show;
  if (!show) return;

  const baseX = game.pos.x + 1.05;
  const baseY = SHOT.spawnY + AIM.barHeight / 2;
  group.position.set(baseX, baseY, game.pos.z);
  // Billboard around Y so the bar always faces the camera but stays upright.
  group.rotation.y = Math.atan2(camera.position.x - baseX, camera.position.z - game.pos.z);

  const h = AIM.barHeight;
  const yAt = (t: number) => (t - 0.5) * h; // bar is centred on the group origin
  if (fill) {
    const t = Math.max(0.0001, game.powerT);
    fill.scale.set(1, t, 1);
    fill.position.set(0, -h / 2 + (t * h) / 2, 0.035);
  }
  if (sweet) sweet.position.set(0, yAt(game.sweetT), 0.03);
  if (marker) marker.position.set(0, yAt(game.powerT), 0);
}

function followCamera(
  game: BasketballGame,
  camera: THREE.Camera,
  look: THREE.Vector3,
  followBall: boolean,
  shakeAmp: number,
): void {
  let targetPos: THREE.Vector3;
  let targetLook: THREE.Vector3;
  let speed: number;

  if (followBall || game.phase === "inflight") {
    // Chase the shot from behind and above.
    targetPos = new THREE.Vector3(game.pos.x * 0.5, game.pos.y + 2.2, game.pos.z + 5.0);
    targetLook = new THREE.Vector3(game.pos.x, game.pos.y, game.pos.z);
    speed = 0.13;
  } else {
    // Aiming: a 3/4 view framed on the ball, with the hoop down-court behind it.
    targetPos = new THREE.Vector3(3.2, 2.9, 6.2);
    targetLook = new THREE.Vector3(0, 2.0, -1.2);
    speed = 0.08;
  }

  camera.position.lerp(targetPos, speed);
  if (shakeAmp > 0) {
    camera.position.x += (Math.random() - 0.5) * shakeAmp;
    camera.position.y += (Math.random() - 0.5) * shakeAmp;
    camera.position.z += (Math.random() - 0.5) * shakeAmp * 0.5;
  }
  look.lerp(targetLook, speed);
  camera.lookAt(look);
}

type Particle = { p: THREE.Vector3; v: THREE.Vector3 };
type NumRef = { current: number };

/** Kick off the score burst: reset particles with outward velocities, show meshes. */
function triggerBurst(
  burstRef: NumRef,
  state: Particle[],
  ringMesh: THREE.Mesh | null,
  group: THREE.Group | null,
): void {
  burstRef.current = BURST_TIME;
  for (const s of state) {
    s.p.set(0, 0, 0);
    s.v.set((Math.random() - 0.5) * 3, Math.random() * 2.5 + 1.0, (Math.random() - 0.5) * 3);
  }
  if (group) group.visible = true;
  if (ringMesh) ringMesh.visible = true;
}

/** Animate the score burst each frame; hide it when finished. */
function updateBurst(
  dt: number,
  burstRef: NumRef,
  state: Particle[],
  ringMesh: THREE.Mesh | null,
  group: THREE.Group | null,
): void {
  if (burstRef.current <= 0) return;
  burstRef.current = Math.max(0, burstRef.current - dt);
  const prog = 1 - burstRef.current / BURST_TIME; // 0 → 1

  if (ringMesh) {
    const s = 0.4 + prog * 2.2;
    ringMesh.scale.set(s, s, s);
    (ringMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - prog) * 0.8;
  }
  if (group) {
    group.children.forEach((child, i) => {
      const st = state[i];
      if (!st) return;
      st.v.y -= 9 * dt;
      st.p.addScaledVector(st.v, dt);
      child.position.copy(st.p);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) mat.opacity = Math.max(0, 1 - prog);
    });
  }
  if (burstRef.current <= 0) {
    if (group) group.visible = false;
    if (ringMesh) ringMesh.visible = false;
  }
}
