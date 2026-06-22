import type { CSSProperties } from "react";
import { GAMES } from "./registry";
import { GameCard } from "./GameCard";
import "./arcade.css";

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

export function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* atmosphere: cobalt grid, drifting orbs, CRT scanlines */}
      <div className="ac-atmos" aria-hidden>
        <div className="ac-grid" />
        <div className="ac-orb ac-orb-a" />
        <div className="ac-orb ac-orb-b" />
        <div className="ac-scan" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24">
        <header className="max-w-3xl">
          <p
            className="ac-reveal font-mono text-[0.7rem] uppercase tracking-[0.34em] text-glow"
            style={delay(0.05)}
          >
            ▸ Insert coin
          </p>
          <h1
            className="ac-reveal mt-4 font-display text-[clamp(2.8rem,9vw,6rem)] font-extrabold leading-[0.92] tracking-tight"
            style={delay(0.12)}
          >
            <span className="ac-wordmark">browsercade</span>
            <span className="ac-caret">▮</span>
          </h1>
          <p
            className="ac-reveal mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg"
            style={delay(0.2)}
          >
            Five 3D games in your browser — each its own from-scratch engine. Play the computer, or a
            friend online over a server-authoritative Go backend.
          </p>
          <div
            className="ac-reveal mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.66rem] uppercase tracking-mono text-faint"
            style={delay(0.28)}
          >
            <span>
              <span className="text-ink">5</span> games
            </span>
            <span className="h-3 w-px bg-hairline" aria-hidden />
            <span>React Three Fiber</span>
            <span className="h-3 w-px bg-hairline" aria-hidden />
            <span>Go WebSocket multiplayer</span>
          </div>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, i) => (
            <div key={game.id} className="ac-reveal h-full" style={delay(0.38 + i * 0.08)}>
              <GameCard game={game} />
            </div>
          ))}
        </div>

        <footer
          className="ac-reveal mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6 font-mono text-[0.66rem] uppercase tracking-mono text-faint"
          style={delay(0.9)}
        >
          <span>browsercade — open source</span>
          <a
            href="https://github.com/erendgrmnc/browsercade"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink"
          >
            View source ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
