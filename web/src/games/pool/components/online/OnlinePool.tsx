/** Online (turn-based) pool: the shared table + the relay lobby/status panel. */
import { Canvas } from "@react-three/fiber";
import { Scene } from "../Scene";
import { CAMERA } from "../../config";
import { Button } from "@/shared/ui/Button";
import { OnlineLobby } from "@/shared/ui/OnlineLobby";
import { useOnlinePool } from "../../hooks/useOnlinePool";

export function OnlinePool() {
  const pool = useOnlinePool();
  const { room } = pool;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="relative h-[440px] cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: CAMERA.position, fov: CAMERA.fov }}>
          <Scene
            game={pool.game}
            simulate={pool.simulate}
            aimable={pool.aimable}
            onStrike={pool.onStrike}
            onFrame={pool.onFrame}
          />
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          {room.phase === "playing"
            ? pool.myTurn
              ? "your shot · aim with mouse, click to strike"
              : "opponent shooting…"
            : "aim with mouse · click to shoot"}
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
        title="Play pool with a friend"
        footer="Take turns at one shared table — sink the most balls when the rack clears. Share the 4-letter code."
      >
        <p className="mt-1 text-lg font-semibold text-ink">{pool.status}</p>
        <p className="mt-2 text-sm text-muted">
          You {pool.seat ? pool.tally[pool.seat] : 0} · Opponent{" "}
          {pool.seat ? pool.tally[pool.seat === "host" ? "guest" : "host"] : 0}
        </p>
        {pool.over && (
          <div className="mt-3">
            <Button onClick={pool.rematch}>Play again</Button>
          </div>
        )}
      </OnlineLobby>
    </div>
  );
}
