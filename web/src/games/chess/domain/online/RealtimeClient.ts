/**
 * Thin WebSocket client for the multiplayer protocol. It only transports
 * messages — all game state lives server-side (the server is authoritative).
 */
import type { ServerMessage } from "./messages";
import type { PieceType, Square } from "@/games/chess/domain/chess/types";

export type RealtimeHandlers = {
  onMessage: (m: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

export class RealtimeClient {
  private ws: WebSocket | null = null;

  constructor(private readonly url: string) {}

  connect(handlers: RealtimeHandlers): void {
    const ws = new WebSocket(this.url);
    ws.onopen = () => handlers.onOpen?.();
    ws.onclose = () => handlers.onClose?.();
    ws.onerror = () => handlers.onError?.();
    ws.onmessage = (e) => {
      try {
        handlers.onMessage(JSON.parse(e.data as string) as ServerMessage);
      } catch {
        /* ignore malformed frames */
      }
    };
    this.ws = ws;
  }

  create(): void {
    this.send({ type: "create" });
  }

  join(room: string): void {
    this.send({ type: "join", room });
  }

  move(from: Square, to: Square, promotion?: PieceType): void {
    this.send({ type: "move", from, to, promotion });
  }

  resign(): void {
    this.send({ type: "resign" });
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  private send(obj: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }
}
