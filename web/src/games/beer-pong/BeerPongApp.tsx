import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { BeerPongHud } from "./components/BeerPongHud";
import { OnlineBeerPong } from "./components/online/OnlineBeerPong";
import { useBeerPong } from "./hooks/useBeerPong";
import { ModeSelect, type ModeOption } from "@/shared/ui/ModeSelect";
import { UserIcon, WifiIcon } from "@/shared/ui/icons";

type Mode = "solo" | "online";

const MODES: ModeOption<Mode>[] = [
  { label: "Solo", value: "solo", icon: <UserIcon /> },
  { label: "Online", value: "online", icon: <WifiIcon /> },
];

/** The beer-pong game module's entry point: a toggle between solo and online play. */
export default function BeerPongApp() {
  const [mode, setMode] = useState<Mode>("solo");

  return (
    <div className="flex flex-col gap-6">
      <ModeSelect options={MODES} value={mode} onChange={setMode} />
      <div key={mode} className="bc-fade">
        {mode === "solo" ? <SoloBeerPong /> : <OnlineBeerPong />}
      </div>
    </div>
  );
}

function SoloBeerPong() {
  const bp = useBeerPong();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={() => bp.game.shoot()}
        className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.4, 4.8], fov: 46 }}>
          <Scene game={bp.game} cups={bp.cups} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          click to throw · mouse to aim
        </span>
      </div>

      <BeerPongHud stats={bp.stats} phase={bp.phase} restart={bp.restart} />
    </div>
  );
}
