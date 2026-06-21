/** Web Worker entry point: runs the engine off the UI thread. */
import { NegamaxEngine } from "@/domain/ai/Engine";
import type { EngineMove } from "@/domain/chess/types";

type Request = { fen: string; depth: number };
type Reply = EngineMove | { gameOver: true };

const engine = new NegamaxEngine();

self.onmessage = (e: MessageEvent<Request>) => {
  const { fen, depth } = e.data;
  const move = engine.bestMove(fen, Math.max(1, depth));
  const reply: Reply = move ?? { gameOver: true };
  (self as unknown as Worker).postMessage(reply);
};
