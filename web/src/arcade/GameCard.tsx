import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { GameDefinition } from "./types";
import { Motif } from "./Motif";

/** Per-game accent colour that tints the screen glow, hover ring and play chip. */
const ACCENT: Record<string, string> = {
  chess: "#8aa0ff",
  "ping-pong": "#56e0ff",
  basketball: "#e8732a",
  "beer-pong": "#e2483b",
  pool: "#f2c12e",
};

export function GameCard({ game }: { game: GameDefinition }) {
  const ready = game.availability === "ready";
  const accent = ACCENT[game.id] ?? "#6b8cff";

  const tile = (
    <div className="ac-tile h-full" style={{ "--g": accent } as CSSProperties}>
      <div className="ac-screen">
        <Motif id={game.id} />
        <span className="ac-status">
          <span className="ac-dot" />
          {ready ? game.tags[0] ?? "demo" : "soon"}
        </span>
        {ready && (
          <span className="ac-play">
            Play <span aria-hidden>▸</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">
          {game.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{game.blurb}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-mono text-faint"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (!ready) return <div className="h-full cursor-not-allowed opacity-60">{tile}</div>;
  return (
    <Link to={`/play/${game.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/70 rounded-[1.25rem]">
      {tile}
    </Link>
  );
}
