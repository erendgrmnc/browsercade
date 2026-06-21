import { useState } from "react";
import { ChessGame } from "@/components/ChessGame";
import { OnlineChessGame } from "@/components/online/OnlineChessGame";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type Mode = "ai" | "online";

const MODES: { label: string; value: Mode }[] = [
  { label: "vs Computer", value: "ai" },
  { label: "Online", value: "online" },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("ai");

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="font-mono text-[0.72rem] uppercase tracking-mono text-accent">3D Chess</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Play chess in 3D</h1>
        <p className="mt-4 leading-relaxed text-muted">
          A browser-playable 3D chessboard. Play the built-in engine — a from-scratch negamax search
          with alpha-beta pruning, run in a Web Worker — or play a friend online over a
          server-authoritative Go WebSocket backend. Built with React Three Fiber and chess.js.
        </p>
      </header>

      <div className="mt-8">
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      </div>

      <main className="mt-8">{mode === "ai" ? <ChessGame /> : <OnlineChessGame />}</main>

      <footer className="mt-12 border-t border-hairline pt-6 font-mono text-[0.7rem] uppercase tracking-mono text-faint">
        Local AI in a Web Worker · server-authoritative multiplayer over WebSocket (Go)
      </footer>
    </div>
  );
}
