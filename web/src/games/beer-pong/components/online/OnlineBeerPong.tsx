/** Online (two-sided) beer-pong: a shared table, your rack vs theirs. */
import { Canvas } from "@react-three/fiber";
import { OnlineBeerPongScene } from "./OnlineBeerPongScene";
import { Button } from "@/shared/ui/Button";
import { OnlineLobby } from "@/shared/ui/OnlineLobby";
import { useOnlineBeerPong } from "../../hooks/useOnlineBeerPong";

export function OnlineBeerPong() {
  const bp = useOnlineBeerPong();
  const { room } = bp;
  const playing = room.phase === "playing";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={bp.onThrow}
        className="relative h-[440px] touch-none cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3.1, 5.8], fov: 46 }}>
          {playing && (
            <OnlineBeerPongScene
              game={bp.game}
              myColor={bp.myColor}
              oppColor={bp.oppColor}
              myTurn={bp.myTurn}
              watching={bp.watching}
              oppBallRef={bp.oppBallRef}
              myCupsActiveRef={bp.myCupsActiveRef}
              onFrame={bp.onFrame}
            />
          )}
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          {playing
            ? bp.myTurn
              ? "your throw · mouse to aim, click to throw"
              : "opponent throwing…"
            : "two-sided beer pong · take turns"}
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
        title="Beer pong with a friend"
        footer="Throw across the table at your opponent's cups — first to clear their rack wins. Share the 4-letter code."
      >
        <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: bp.myColor }} />
          {bp.status}
        </p>
        <p className="mt-2 text-sm text-muted">
          Their cups <span className="font-display text-xl text-ink">{bp.oppCupsLeft}</span> · Your cups{" "}
          <span className="font-display text-xl text-ink">{bp.myCupsLeft}</span>
        </p>
        {bp.over && (
          <div className="mt-3">
            <Button onClick={bp.rematch}>Play again</Button>
          </div>
        )}
      </OnlineLobby>
    </div>
  );
}
