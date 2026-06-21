import { ChessGame } from "@/components/ChessGame";

export default function App() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="font-mono text-[0.72rem] uppercase tracking-mono text-accent">3D Chess</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Play chess in 3D</h1>
        <p className="mt-4 leading-relaxed text-muted">
          A browser-playable 3D chessboard. Rules come from <code>chess.js</code>; the opponent is a
          from-scratch negamax search with alpha-beta pruning and a material + piece-square
          evaluation, run in a Web Worker. Built with React Three Fiber. Drag to orbit; click a
          piece to see its legal moves.
        </p>
      </header>

      <main className="mt-10">
        <ChessGame />
      </main>

      <footer className="mt-12 border-t border-hairline pt-6 font-mono text-[0.7rem] uppercase tracking-mono text-faint">
        Online multiplayer (Go + WebSocket) — coming next.
      </footer>
    </div>
  );
}
