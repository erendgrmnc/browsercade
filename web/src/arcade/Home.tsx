import { GAMES } from "./registry";
import { GameCard } from "./GameCard";

export function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="font-mono text-[0.72rem] uppercase tracking-mono text-accent">browsercade</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          A little arcade in your browser.
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          A handful of 3D games built with React Three Fiber — play the computer, or a friend online
          over a server-authoritative Go backend.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <footer className="mt-12 border-t border-hairline pt-6 font-mono text-[0.7rem] uppercase tracking-mono text-faint">
        React Three Fiber · Go WebSocket multiplayer
      </footer>
    </div>
  );
}
