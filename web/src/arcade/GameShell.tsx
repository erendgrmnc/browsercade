import { Suspense, lazy, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { findGame } from "./registry";
import "@/shared/ui/controls.css";

/** Route wrapper for a single game: resolves the slug, lazy-loads the module. */
export function GameShell() {
  const { id } = useParams();
  const game = findGame(id);

  const LazyGame = useMemo(() => (game?.load ? lazy(game.load) : null), [game]);

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 md:py-14">
      <Link to="/" className="font-mono text-[0.72rem] uppercase tracking-mono text-faint hover:text-ink">
        ← Arcade
      </Link>

      {!game && (
        <p className="mt-8 text-muted">
          Game not found.{" "}
          <Link to="/" className="text-accent">
            Back to the arcade.
          </Link>
        </p>
      )}

      {game && (
        <>
          <h1
            className="bc-rise mt-6 text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ animationDelay: "0.04s" }}
          >
            {game.title}
          </h1>
          <p
            className="bc-rise mt-2 max-w-2xl text-sm leading-relaxed text-muted"
            style={{ animationDelay: "0.12s" }}
          >
            {game.blurb}
          </p>
          <div className="bc-rise mt-8" style={{ animationDelay: "0.2s" }}>
            {LazyGame ? (
              <Suspense fallback={<LoadingPanel />}>
                <LazyGame />
              </Suspense>
            ) : (
              <p className="text-muted">This game is coming soon.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex h-[440px] items-center justify-center rounded-2xl border border-hairline bg-panel sm:h-[560px]">
      <div className="bc-loader">
        <div className="bc-loader-ring" aria-hidden />
        <span className="bc-loader-label">Loading game…</span>
      </div>
    </div>
  );
}
