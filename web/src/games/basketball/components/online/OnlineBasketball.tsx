/** Online basketball: turn-based first-to-7 with the three-stage shot meter. */
import { Canvas } from "@react-three/fiber";
import { Scene } from "../Scene";
import { stageHint } from "../aimText";
import { Button } from "@/shared/ui/Button";
import { OnlineLobby } from "@/shared/ui/OnlineLobby";
import { RULES } from "../../config";
import { useOnlineBasketball } from "../../hooks/useOnlineBasketball";

export function OnlineBasketball() {
  const bb = useOnlineBasketball();
  const { room } = bb;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={bb.onShoot}
        className="relative h-[440px] touch-none cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3.2, 6.5], fov: 48 }}>
          <Scene
            game={bb.game}
            interactive={bb.interactive}
            simulate={bb.simulate}
            followBall={bb.followBall}
            onFrame={bb.onFrame}
          />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          {room.phase === "playing"
            ? bb.myTurn
              ? stageHint(bb.stage)
              : "opponent shooting…"
            : "first to 7 baskets · take turns"}
        </span>
      </div>

      <OnlineLobby
        phase={room.phase}
        seat={room.seat}
        roomCode={room.roomCode}
        notice={room.notice}
        createGame={room.createGame}
        joinGame={room.joinGame}
        leave={room.leave}
        title="Shoot-out with a friend"
        footer={`Take turns shooting — first to ${RULES.winBaskets} baskets wins. Share the 4-letter code.`}
      >
        <p className="mt-1 text-lg font-semibold text-ink">{bb.status}</p>
        <div className="mt-2 flex items-baseline gap-4">
          <p className="text-sm text-muted">
            You <span className="font-display text-2xl text-ink">{bb.myScore}</span>
          </p>
          <p className="text-sm text-muted">
            Opp <span className="font-display text-2xl text-ink">{bb.oppScore}</span>
          </p>
          <p className="font-mono text-[0.7rem] text-faint">/ {RULES.winBaskets}</p>
        </div>
        {bb.over && (
          <div className="mt-3">
            <Button onClick={bb.rematch}>Play again</Button>
          </div>
        )}
      </OnlineLobby>
    </div>
  );
}
