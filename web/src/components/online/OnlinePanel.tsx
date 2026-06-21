/** Lobby + in-game side panel for online play, driven by useOnlineGame. */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { OnlineGameState } from "@/hooks/useOnlineGame";

export function OnlinePanel({ game }: { game: OnlineGameState }) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col gap-5">
      {game.phase === "idle" && (
        <>
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Online</p>
            <p className="mt-1 text-lg font-semibold text-ink">Play a friend</p>
          </div>
          <Button onClick={game.createGame}>Create game</Button>
          <div className="flex flex-col gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && game.joinGame(code)}
              placeholder="ROOM CODE"
              maxLength={4}
              aria-label="Room code"
              className="w-full rounded-lg border border-hairline bg-panel px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <Button onClick={() => game.joinGame(code)}>Join game</Button>
          </div>
        </>
      )}

      {game.phase === "connecting" && <p className="text-muted">Connecting…</p>}

      {game.phase === "waiting" && (
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Room code</p>
          <p className="mt-1 font-mono text-3xl tracking-[0.3em] text-accent">{game.roomCode}</p>
          <p className="mt-3 text-sm text-muted">Waiting for an opponent to join…</p>
        </div>
      )}

      {(game.phase === "playing" || game.phase === "ended") && (
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">
            You play {game.myColor === "w" ? "White" : "Black"} · Room {game.roomCode}
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {game.phase === "ended" ? "Game over" : game.isMyTurn ? "Your move" : "Opponent's move"}
          </p>
        </div>
      )}

      {game.notice && <p className="text-sm leading-relaxed text-muted">{game.notice}</p>}

      <div className="flex flex-wrap gap-2">
        {game.phase === "playing" && <Button onClick={game.resign}>Resign</Button>}
        {game.phase !== "idle" && (
          <Button onClick={game.leave}>{game.phase === "ended" ? "Back to lobby" : "Leave"}</Button>
        )}
      </div>

      <p className="text-[0.72rem] leading-relaxed text-faint">
        Moves are validated by an authoritative Go server over WebSocket. Share the 4-letter room
        code to play a friend.
      </p>
    </div>
  );
}
