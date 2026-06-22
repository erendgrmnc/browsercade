import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BeerPongGame } from "../../domain/BeerPongGame";
import { CUP, TABLE, THROW, palette } from "../../config";
import { clamp, lerp } from "@/shared/math";

const TABLE_HALF_LENGTH = 4.2; // long enough to seat a rack at each end
const BURST_TIME = 0.6;
const PARTICLES = 14;

/** Cup positions of one rack in canonical (far) coordinates, ordered like buildRack. */
function rackLayout(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  CUP.rows.forEach((count, row) => {
    const z = CUP.frontZ - row * CUP.rowGap;
    for (let i = 0; i < count; i++) out.push({ x: (i - (count - 1) / 2) * CUP.gap, z });
  });
  return out;
}

type Props = {
  game: BeerPongGame;
  myColor: string;
  oppColor: string;
  myTurn: boolean;
  watching: boolean;
  oppBallRef: { current: { x: number; y: number; z: number } };
  myCupsActiveRef: { current: boolean[] };
  onFrame: () => void;
};

export function OnlineBeerPongScene({
  game,
  myColor,
  oppColor,
  myTurn,
  watching,
  oppBallRef,
  myCupsActiveRef,
  onFrame,
}: Props) {
  const layout = useMemo(rackLayout, []);
  const far = useMemo(() => layout.map((c) => ({ x: c.x, z: c.z })), [layout]); // opponent's cups (I throw at)
  const near = useMemo(() => layout.map((c) => ({ x: -c.x, z: -c.z })), [layout]); // my cups (mirror)

  const ball = useRef<THREE.Mesh>(null);
  const target = useRef<THREE.Mesh>(null);
  const farRefs = useRef<(THREE.Mesh | null)[]>([]);
  const nearRefs = useRef<(THREE.Mesh | null)[]>([]);
  const prevFar = useRef<boolean[]>(layout.map(() => true));
  const prevNear = useRef<boolean[]>(layout.map(() => true));

  // Splash burst (one cup sinks at a time, so a single pool is enough).
  const burst = useRef(0);
  const ring = useRef<THREE.Mesh>(null);
  const particles = useRef<THREE.Group>(null);
  const partState = useRef(
    Array.from({ length: PARTICLES }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3() })),
  );
  const camLook = useRef(new THREE.Vector3(0, 0.4, -0.5));
  const { pointer, camera } = useThree();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);

    if (myTurn) {
      game.aimYaw = clamp(pointer.x, -1, 1) * THROW.maxYaw;
      game.aimPower = lerp(THROW.basePower, THROW.maxPower, clamp((pointer.y + 1) / 2, 0, 1));
      game.update(dt);
      onFrame();
    }

    // Ball position: my throw is canonical; the opponent's is mirrored onto my side.
    let bx: number, by: number, bz: number, flying: boolean;
    if (myTurn) {
      bx = game.pos.x;
      by = game.pos.y;
      bz = game.pos.z;
      flying = game.phase === "inflight";
    } else {
      const o = oppBallRef.current;
      bx = -o.x;
      by = o.y;
      bz = -o.z;
      flying = watching;
    }
    ball.current?.position.set(bx, by, bz);
    if (ball.current) ball.current.visible = myTurn || watching;

    // Rack visibility + cup-sink VFX (diff active → inactive).
    syncRack(game.cups.map((c) => c.active), farRefs.current, prevFar.current, far, oppColor, fireBurst);
    syncRack(myCupsActiveRef.current, nearRefs.current, prevNear.current, near, myColor, fireBurst);

    // Aim ring on the opponent's rack while aiming.
    if (target.current) {
      const show = myTurn && game.phase === "aiming";
      target.current.visible = show;
      if (show) {
        const l = game.predictedLanding();
        target.current.position.set(l.x, 0.02, l.z);
      }
    }

    updateBurst(dt, burst, partState.current, ring.current, particles.current);
    followCamera(camera, camLook.current, flying, bx, by, bz);

    function fireBurst(x: number, z: number, color: string) {
      triggerBurst(burst, partState.current, ring.current, particles.current, x, z, color);
    }
  });

  return (
    <>
      <color attach="background" args={[palette.floor]} />
      <fog attach="fog" args={[palette.floor, 10, 22]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 7, 4]} intensity={1.05} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 5, -3]} intensity={0.25} color="#88a6ff" />

      {/* Long two-sided table */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[TABLE.halfWidth * 2, 0.12, TABLE_HALF_LENGTH * 2]} />
        <meshStandardMaterial color={palette.table} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.04, 0.02, TABLE_HALF_LENGTH * 2]} />
        <meshStandardMaterial color={palette.tableEdge} />
      </mesh>

      {/* Opponent's rack (far) — I throw at these */}
      {far.map((c, i) => (
        <mesh key={`f${i}`} ref={(m) => (farRefs.current[i] = m)} position={[c.x, CUP.height / 2, c.z]} castShadow>
          <cylinderGeometry args={[CUP.radius, CUP.radius * 0.8, CUP.height, 18, 1, true]} />
          <meshStandardMaterial color={oppColor} side={THREE.DoubleSide} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}

      {/* My rack (near) — the opponent throws at these */}
      {near.map((c, i) => (
        <mesh key={`n${i}`} ref={(m) => (nearRefs.current[i] = m)} position={[c.x, CUP.height / 2, c.z]} castShadow>
          <cylinderGeometry args={[CUP.radius, CUP.radius * 0.8, CUP.height, 18, 1, true]} />
          <meshStandardMaterial color={myColor} side={THREE.DoubleSide} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}

      <mesh ref={ball} castShadow>
        <sphereGeometry args={[THROW.ballRadius, 18, 14]} />
        <meshStandardMaterial color={palette.ball} roughness={0.5} />
      </mesh>

      <mesh ref={target} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.1, 0.15, 24]} />
        <meshBasicMaterial color={palette.target} transparent opacity={0.7} />
      </mesh>

      {/* Splash burst */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.1, 0.18, 28]} />
        <meshBasicMaterial color="#bfe9ff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <group ref={particles} visible={false}>
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#dff3ff" emissive="#9fd8ff" emissiveIntensity={0.6} transparent />
          </mesh>
        ))}
      </group>
    </>
  );
}

function syncRack(
  active: boolean[],
  meshes: (THREE.Mesh | null)[],
  prev: boolean[],
  pos: { x: number; z: number }[],
  color: string,
  onSink: (x: number, z: number, color: string) => void,
): void {
  for (let i = 0; i < meshes.length; i++) {
    const a = active[i] ?? true;
    const m = meshes[i];
    if (m) m.visible = a;
    if (prev[i] && !a) onSink(pos[i].x, pos[i].z, color); // cup just sank
    prev[i] = a;
  }
}

type Particle = { p: THREE.Vector3; v: THREE.Vector3 };
type NumRef = { current: number };

function triggerBurst(
  burstRef: NumRef,
  state: Particle[],
  ringMesh: THREE.Mesh | null,
  group: THREE.Group | null,
  x: number,
  z: number,
  color: string,
): void {
  burstRef.current = BURST_TIME;
  for (const s of state) {
    s.p.set(x, CUP.height, z);
    s.v.set((Math.random() - 0.5) * 2.2, Math.random() * 2.2 + 1.0, (Math.random() - 0.5) * 2.2);
  }
  if (group) group.visible = true;
  if (ringMesh) {
    ringMesh.visible = true;
    ringMesh.position.set(x, CUP.height + 0.01, z);
    (ringMesh.material as THREE.MeshBasicMaterial).color.set(color);
  }
}

function updateBurst(
  dt: number,
  burstRef: NumRef,
  state: Particle[],
  ringMesh: THREE.Mesh | null,
  group: THREE.Group | null,
): void {
  if (burstRef.current <= 0) return;
  burstRef.current = Math.max(0, burstRef.current - dt);
  const prog = 1 - burstRef.current / BURST_TIME;

  if (ringMesh) {
    const s = 0.3 + prog * 1.8;
    ringMesh.scale.set(s, s, s);
    (ringMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - prog) * 0.8;
  }
  if (group) {
    group.children.forEach((child, i) => {
      const st = state[i];
      if (!st) return;
      st.v.y -= 7 * dt;
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

function followCamera(
  camera: THREE.Camera,
  look: THREE.Vector3,
  flying: boolean,
  bx: number,
  by: number,
  bz: number,
): void {
  let targetPos: THREE.Vector3;
  let targetLook: THREE.Vector3;
  let speed: number;
  if (flying) {
    targetPos = new THREE.Vector3(bx * 0.4, by + 1.7, bz + 3.0);
    targetLook = new THREE.Vector3(bx, by, bz);
    speed = 0.12;
  } else {
    targetPos = new THREE.Vector3(0, 3.1, 5.8); // behind my rack, looking across the table
    targetLook = new THREE.Vector3(0, 0.4, -1.0);
    speed = 0.08;
  }
  camera.position.lerp(targetPos, speed);
  look.lerp(targetLook, speed);
  camera.lookAt(look);
}
