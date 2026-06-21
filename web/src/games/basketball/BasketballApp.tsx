import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/Scene";
import { BasketballHud } from "./components/BasketballHud";
import { useBasketball } from "./hooks/useBasketball";

/** The basketball game module's entry point. */
export default function BasketballApp() {
  const bb = useBasketball();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={() => bb.game.shoot()}
        className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3.2, 6.5], fov: 48 }}>
          <Scene game={bb.game} />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          click to shoot · mouse to aim
        </span>
      </div>

      <BasketballHud stats={bb.stats} clock={bb.clock} phase={bb.phase} restart={bb.restart} />
    </div>
  );
}
