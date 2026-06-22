import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { BasketballHud } from "./components/BasketballHud";
import { OnlineBasketball } from "./components/online/OnlineBasketball";
import { stageHint } from "./components/aimText";
import { useBasketball } from "./hooks/useBasketball";
import { ModeSelect, type ModeOption } from "@/shared/ui/ModeSelect";
import { UserIcon, WifiIcon } from "@/shared/ui/icons";

type Mode = "solo" | "online";

const MODES: ModeOption<Mode>[] = [
  { label: "Solo", value: "solo", icon: <UserIcon /> },
  { label: "Online", value: "online", icon: <WifiIcon /> },
];

/** The basketball game module's entry point: a toggle between solo and online play. */
export default function BasketballApp() {
  const [mode, setMode] = useState<Mode>("solo");

  return (
    <div className="flex flex-col gap-6">
      <ModeSelect options={MODES} value={mode} onChange={setMode} />
      <div key={mode} className="bc-fade">
        {mode === "solo" ? <SoloBasketball /> : <OnlineBasketball />}
      </div>
    </div>
  );
}

function SoloBasketball() {
  const bb = useBasketball();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={() => bb.game.press()}
        className="relative h-[440px] touch-none cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3.2, 6.5], fov: 48 }}>
          <Scene game={bb.game} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          {stageHint(bb.stage)}
        </span>
      </div>

      <BasketballHud stats={bb.stats} clock={bb.clock} phase={bb.phase} stage={bb.stage} restart={bb.restart} />
    </div>
  );
}
