import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { PoolHud } from "./components/PoolHud";
import { usePool } from "./hooks/usePool";

/** The pool game module's entry point. */
export default function PoolApp() {
  const pool = usePool();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 4.2, 2.4], fov: 44 }}>
          <Scene game={pool.game} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          aim with mouse · click to shoot
        </span>
      </div>

      <PoolHud pocketed={pool.pocketed} phase={pool.phase} restart={pool.restart} />
    </div>
  );
}
