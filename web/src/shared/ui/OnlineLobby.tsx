/**
 * Shared lobby/side-panel for online play, driven by useRelayRoom. Renders the
 * create/join controls when idle, an animated waiting state with the room code
 * while we wait, and a compact versus header (plus game-specific `children`)
 * once playing. Reused by every physics game so the online UX matches chess.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CodeInput } from "./CodeInput";
import { CopyIcon, CheckIcon, PlusIcon, WifiIcon } from "./icons";
import "./controls.css";
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
        <div key="idle" className="bc-fade flex flex-col gap-5">
          <div>
            <p className="bc-eyebrow">
              <span className="bc-live" /> Online
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">{title}</p>
          </div>

          <button type="button" className="bc-cta" onClick={createGame}>
            <PlusIcon /> Create game
          </button>

          <p className="bc-or">or join a room</p>

          <div className="flex flex-col gap-3">
            <CodeInput value={code} onChange={setCode} onEnter={() => code.length === 4 && joinGame(code)} />
            <button
              type="button"
              className="bc-ghost"
              disabled={code.length < 4}
              onClick={() => joinGame(code)}
            >
              <WifiIcon /> Join game
            </button>
          </div>

          <p className="text-[0.72rem] leading-relaxed text-faint">{footer}</p>
        </div>
      )}

      {phase === "connecting" && (
        <div key="connecting" className="bc-fade flex flex-col items-center gap-4 py-6">
          <Radar />
          <p className="font-mono text-[0.7rem] uppercase tracking-mono text-muted">Connecting…</p>
        </div>
      )}

      {phase === "waiting" && (
        <div key="waiting" className="bc-fade flex flex-col gap-5">
          <div>
            <p className="bc-eyebrow">Room code</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="bc-roomcode">{roomCode}</span>
              <CopyButton text={roomCode ?? ""} />
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
          <button type="button" className="bc-ghost" onClick={leave}>
            Leave
          </button>
        </div>
      )}

      {(phase === "playing" || phase === "ended") && (
        <div key="playing" className="bc-fade flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="bc-versus">
              <span className={`bc-seat${seat === "host" ? " is-you" : ""}`}>
                <span className="bc-seat-dot" style={{ background: "#6b8cff", boxShadow: "0 0 8px #6b8cff" }} />
                {seat === "host" ? "You" : "P1"}
              </span>
              <span className="bc-vs">VS</span>
              <span className={`bc-seat${seat === "guest" ? " is-you" : ""}`}>
                <span className="bc-seat-dot" style={{ background: "#e2483b", boxShadow: "0 0 8px #e2483b" }} />
                {seat === "guest" ? "You" : "P2"}
              </span>
            </div>
            {roomCode && (
              <span className="bc-roomchip">
                Room <b>{roomCode}</b>
              </span>
            )}
          </div>
          {children}
          <button type="button" className="bc-ghost" onClick={leave}>
            {phase === "ended" ? "Back to lobby" : "Leave game"}
          </button>
        </div>
      )}

      {notice && phase !== "idle" && (
        <p className="text-sm leading-relaxed text-muted">{notice}</p>
      )}
      {notice && phase === "idle" && (
        <p className="text-sm leading-relaxed" style={{ color: "#e2746b" }}>{notice}</p>
      )}
    </div>
  );
}

/** Concentric "pinging" radar used by the connecting/waiting states. */
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

/** Copy-to-clipboard button that flips to a check for a moment. */
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
