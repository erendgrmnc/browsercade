/** Online (real-time) table tennis: the shared table + the relay lobby panel. */
import { Canvas } from "@react-three/fiber";
import { OnlinePingPongScene } from "./OnlinePingPongScene";
import { useOnlinePingPong } from "../../hooks/useOnlinePingPong";
import { Button } from "@/shared/ui/Button";
import { OnlineLobby } from "@/shared/ui/OnlineLobby";

export function OnlinePingPong() {
  const pp = useOnlinePingPong();
  const { room } = pp;
  const playing = room.phase === "playing";

  const onPointerDown = () => {
    if (playing && pp.isHost) pp.game.press();
  };
  const onPointerUp = () => {
    if (!playing) return;
    if (pp.isHost) pp.game.release();
    else pp.sendServe();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="relative h-[440px] touch-none cursor-crosshair overflow-hidden rounded-2xl border border-hairline bg-[#0d1016] sm:h-[560px]"
      >
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.15, 5.2], fov: 38 }}>
          {playing && (
            <OnlinePingPongScene
              game={pp.game}
              isHost={pp.isHost}
              guestInputXRef={pp.guestInputXRef}
              broadcastState={pp.broadcastState}
              snapshotRef={pp.snapshotRef}
              sendInput={pp.sendInput}
            />
          )}
        </Canvas>
        <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.6rem] uppercase tracking-mono text-white/40">
          {playing
            ? pp.isMyServe
              ? "your serve — flick forward, then click"
              : "slide to aim · flick forward to hit"
            : "waiting for the match to start…"}
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
        title="Play table tennis with a friend"
        footer="Real-time 1v1 — first to 11. Share the 4-letter code; the host serves first."
      >
        <p className="mt-1 text-lg font-semibold text-ink">{pp.status}</p>
        <p className="mt-2 text-sm text-muted">
          You <span className="font-display text-xl text-ink">{pp.myScore}</span> · Opponent{" "}
          <span className="font-display text-xl text-ink">{pp.oppScore}</span>
        </p>
        {pp.over && pp.isHost && (
          <div className="mt-3">
            <Button onClick={pp.restart}>Rematch</Button>
          </div>
        )}
        {pp.over && !pp.isHost && <p className="mt-2 text-sm text-muted">Waiting for host to restart…</p>}
      </OnlineLobby>
    </div>
  );
}
