/** An Opponent backed by the local engine, run in a Web Worker (off the UI thread). */
import type { Opponent } from "./Opponent";
import type { EngineMove } from "@/games/chess/domain/chess/types";

type WorkerReply = EngineMove | { gameOver: true };

export class LocalAIOpponent implements Opponent {
  private readonly worker: Worker;
  private level: number;
  private resolveCurrent: ((move: EngineMove) => void) | null = null;

  constructor(level = 3) {
    this.level = level;
    this.worker = new Worker(new URL("../../workers/ai.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const resolve = this.resolveCurrent;
      this.resolveCurrent = null;
      if (resolve && !("gameOver" in e.data)) resolve(e.data);
    };
  }

  requestMove(fen: string): Promise<EngineMove> {
    return new Promise((resolve) => {
      this.resolveCurrent = resolve;
      this.worker.postMessage({ fen, depth: this.level });
    });
  }

  setLevel(level: number): void {
    this.level = level;
  }

  dispose(): void {
    this.worker.terminate();
  }
}
