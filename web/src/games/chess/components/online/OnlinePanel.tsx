/** Lobby + in-game side panel for online play, driven by useOnlineGame. */
import { useEffect, useRef, useState } from "react";
import { CodeInput } from "@/shared/ui/CodeInput";
import { CopyIcon, CheckIcon, PlusIcon, WifiIcon } from "@/shared/ui/icons";
import "@/shared/ui/controls.css";
import type { OnlineGameState } from "@/games/chess/hooks/useOnlineGame";

export function OnlinePanel({ game }: { game: OnlineGameState }) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col gap-5">
      {game.phase === "idle" && (
        <div key="idle" className="bc-fade flex flex-col gap-5">
          <div>
            <p className="bc-eyebrow">
              <span className="bc-live" /> Online
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">Play a friend</p>
          </div>

          <button type="button" className="bc-cta" onClick={game.createGame}>
            <PlusIcon /> Create game
          </button>

          <p className="bc-or">or join a room</p>

          <div className="flex flex-col gap-3">
            <CodeInput value={code} onChange={setCode} onEnter={() => code.length === 4 && game.joinGame(code)} />
            <button
              type="button"
              className="bc-ghost"
              disabled={code.length < 4}
              onClick={() => game.joinGame(code)}
            >
              <WifiIcon /> Join game
            </button>
          </div>

          <p className="text-[0.72rem] leading-relaxed text-faint">
            Moves are validated by an authoritative Go server over WebSocket. Share the 4-letter room
            code to play a friend.
          </p>
        </div>
      )}

      {game.phase === "connecting" && (
        <div key="connecting" className="bc-fade flex flex-col items-center gap-4 py-6">
          <Radar />
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-muted">Connecting…</p>
        </div>
      )}

      {game.phase === "waiting" && (
        <div key="waiting" className="bc-fade flex flex-col gap-5">
          <div>
            <p className="bc-eyebrow">Room code</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="bc-roomcode">{game.roomCode}</span>
              <CopyButton text={game.roomCode ?? ""} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Radar />
            <p className="text-sm leading-relaxed text-muted">
              Waiting for an opponent to join…
              <br />
              <span className="text-faint">Send them the code above.</span>
            </p>
          </div>
          <button type="button" className="bc-ghost" onClick={game.leave}>
            Leave
          </button>
        </div>
      )}

      {(game.phase === "playing" || game.phase === "ended") && (
        <div key="playing" className="bc-fade flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bc-versus">
              <span className={`bc-seat${game.myColor === "w" ? " is-you" : ""}`}>
                <span className="bc-seat-dot" style={{ background: "#eaf0ff", boxShadow: "0 0 8px rgba(234,240,255,0.8)" }} />
                {game.myColor === "w" ? "You · White" : "White"}
              </span>
              <span className="bc-vs">VS</span>
              <span className={`bc-seat${game.myColor === "b" ? " is-you" : ""}`}>
                <span className="bc-seat-dot" style={{ background: "#2c3242", boxShadow: "0 0 8px rgba(20,24,34,0.8)", border: "1px solid rgba(255,255,255,0.25)" }} />
                {game.myColor === "b" ? "You · Black" : "Black"}
              </span>
            </div>
            {game.roomCode && (
              <span className="bc-roomchip">
                Room <b>{game.roomCode}</b>
              </span>
            )}
          </div>

          <p className="text-lg font-semibold text-ink">
            {game.phase === "ended" ? "Game over" : game.isMyTurn ? "Your move" : "Opponent's move"}
          </p>

          <div className="flex flex-col gap-2">
            {game.phase === "playing" && (
              <button type="button" className="bc-ghost" onClick={game.resign}>
                Resign
              </button>
            )}
            <button type="button" className="bc-ghost" onClick={game.leave}>
              {game.phase === "ended" ? "Back to lobby" : "Leave game"}
            </button>
          </div>
        </div>
      )}

      {game.notice && game.phase !== "idle" && (
        <p className="text-sm leading-relaxed text-muted">{game.notice}</p>
      )}
      {game.notice && game.phase === "idle" && (
        <p className="text-sm leading-relaxed" style={{ color: "#e2746b" }}>{game.notice}</p>
      )}
    </div>
  );
}

function Radar() {
  return (
    <div className="bc-radar" aria-hidden>
      <span className="bc-ping" />
      <span className="bc-ping" />
      <span className="bc-ping" />
      <span className="bc-core" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function copy() {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1400);
    });
  }

  return (
    <button
      type="button"
      className={`bc-copy${done ? " is-done" : ""}`}
      onClick={copy}
      aria-label={done ? "Copied" : "Copy room code"}
      title={done ? "Copied!" : "Copy room code"}
    >
      {done ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
