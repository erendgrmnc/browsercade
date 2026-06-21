import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { PingPongHud } from "./components/PingPongHud";
import { usePingPong } from "./hooks/usePingPong";

/** The table-tennis game module's entry point (vs AI). */
export default function PingPongApp() {
  const pp = usePingPong();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={() => pp.game.press()}
        onPointerUp={() => pp.game.release()}
        onPointerLeave={() => pp.game.cancelCharge()}
        className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.15, 5.2], fov: 38 }}>
          <Scene game={pp.game} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          slide to aim · flick forward to hit hard · click to serve
        </span>
      </div>

      <PingPongHud
        score={pp.score}
        phase={pp.phase}
        server={pp.server}
        difficulty={pp.difficulty}
        setDifficulty={pp.setDifficulty}
        restart={pp.restart}
      />
    </div>
  );
}
