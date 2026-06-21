import { Link } from "react-router-dom";
import type { GameDefinition } from "./types";

export function GameCard({ game }: { game: GameDefinition }) {
  const ready = game.availability === "ready";
  const card = (
    <div
      className={`flex h-full flex-col rounded-2xl border border-hairline bg-panel p-5 transition-colors ${
        ready ? "group-hover:border-accent" : "opacity-60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{game.title}</h3>
        {!ready && (
          <span className="rounded-full bg-hairline px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-mono text-faint">
            Soon
          </span>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{game.blurb}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {game.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-mono text-faint"
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );

  if (!ready) return <div className="h-full cursor-not-allowed">{card}</div>;
  return (
    <Link to={`/play/${game.id}`} className="group block h-full">
      {card}
    </Link>
  );
}
