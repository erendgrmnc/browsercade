/**
 * Shared lobby/side-panel for online play, driven by useRelayRoom. Renders the
 * create/join controls when idle, the room code while waiting, and a compact
 * status header (plus game-specific `children`) once playing. Reused by every
 * physics game so the online UX matches chess.
 */
import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import type { RelayPhase } from "@/shared/net/useRelayRoom";
import type { Seat } from "@/shared/net/RelayClient";

export function OnlineLobby({
  phase,
  seat,
  roomCode,
  notice,
  createGame,
  joinGame,
  leave,
  title = "Play a friend",
  footer = "Share the 4-letter room code with a friend to play head-to-head.",
  children,
}: {
  phase: RelayPhase;
  seat: Seat | null;
  roomCode: string | null;
  notice: string | null;
  createGame: () => void;
  joinGame: (code: string) => void;
  leave: () => void;
  title?: string;
  footer?: string;
  children?: ReactNode;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col gap-5">
      {phase === "idle" && (
        <>
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Online</p>
            <p className="mt-1 text-lg font-semibold text-ink">{title}</p>
          </div>
          <Button onClick={createGame}>Create game</Button>
          <div className="flex flex-col gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinGame(code)}
              placeholder="ROOM CODE"
              maxLength={4}
              aria-label="Room code"
              className="w-full rounded-lg border border-hairline bg-panel px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.3em] text-ink placeholder:tracking-normal placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <Button onClick={() => joinGame(code)}>Join game</Button>
          </div>
        </>
      )}

      {phase === "connecting" && <p className="text-muted">Connecting…</p>}

      {phase === "waiting" && (
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">Room code</p>
          <p className="mt-1 font-mono text-3xl tracking-[0.3em] text-accent">{roomCode}</p>
          <p className="mt-3 text-sm text-muted">Waiting for an opponent to join…</p>
        </div>
      )}

      {(phase === "playing" || phase === "ended") && (
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-faint">
            You are {seat === "host" ? "Player 1" : "Player 2"} · Room {roomCode}
          </p>
          {children}
        </div>
      )}

      {notice && <p className="text-sm leading-relaxed text-muted">{notice}</p>}

      <div className="flex flex-wrap gap-2">
        {phase !== "idle" && (
          <Button onClick={leave}>{phase === "ended" ? "Back to lobby" : "Leave"}</Button>
        )}
      </div>

      {phase === "idle" && (
        <p className="text-[0.72rem] leading-relaxed text-faint">{footer}</p>
      )}
    </div>
  );
}
