import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { PingPongHud } from "./components/PingPongHud";
import { usePingPong } from "./hooks/usePingPong";

/** The ping-pong game module's entry point (vs AI). */
export default function PingPongApp() {
  const pp = usePingPong();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="relative h-[440px] overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.8, 4.6], fov: 46 }}>
          <Scene game={pp.game} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          move mouse to aim · near paddle is yours
        </span>
      </div>

      <PingPongHud
        score={pp.score}
        phase={pp.phase}
        difficulty={pp.difficulty}
        setDifficulty={pp.setDifficulty}
        restart={pp.restart}
      />
    </div>
  );
}
