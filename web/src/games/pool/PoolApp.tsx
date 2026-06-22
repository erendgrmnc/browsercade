import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { PoolHud } from "./components/PoolHud";
import { OnlinePool } from "./components/online/OnlinePool";
import { usePool } from "./hooks/usePool";
import { CAMERA } from "./config";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

type Mode = "solo" | "online";

const MODES: { label: string; value: Mode }[] = [
  { label: "Solo", value: "solo" },
  { label: "Online", value: "online" },
];

/** The pool game module's entry point: a toggle between solo and online play. */
export default function PoolApp() {
  const [mode, setMode] = useState<Mode>("solo");

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      {mode === "solo" ? <SoloPool /> : <OnlinePool />}
    </div>
  );
}

function SoloPool() {
  const pool = usePool();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: CAMERA.position, fov: CAMERA.fov }}>
          <Scene game={pool.game} aimable={pool.aimable} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          aim with mouse · hold to charge · release to shoot
        </span>
      </div>

      <PoolHud phase={pool.phase} rules={pool.rules} restart={pool.restart} />
    </div>
  );
}
