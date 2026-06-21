/**
 * Game-agnostic WebSocket client for the relay protocol (mirrors the chess
 * RealtimeClient, but the server only forwards opaque payloads between the two
 * peers). Game state lives entirely in the browser; this just transports it.
 */
export type Seat = "host" | "guest";

/** Anything the relay server sends us. `payload` is the opaque game message. */
export type RelayServerMessage = {
  type: "joined" | "opponentJoined" | "opponentLeft" | "relay" | "error";
  room?: string;
  game?: string;
  seat?: Seat;
  payload?: unknown;
  message?: string;
};

export type RelayHandlers = {
  onMessage: (m: RelayServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

export class RelayClient {
  private ws: WebSocket | null = null;

  constructor(private readonly url: string) {}

  connect(handlers: RelayHandlers): void {
    const ws = new WebSocket(this.url);
    ws.onopen = () => handlers.onOpen?.();
    ws.onclose = () => handlers.onClose?.();
    ws.onerror = () => handlers.onError?.();
    ws.onmessage = (e) => {
      try {
        handlers.onMessage(JSON.parse(e.data as string) as RelayServerMessage);
      } catch {
        /* ignore malformed frames */
      }
    };
    this.ws = ws;
  }

  create(game: string): void {
    this.send({ type: "create", game });
  }

  join(game: string, room: string): void {
    this.send({ type: "join", game, room });
  }

  /** Forward an opaque, game-specific payload to the other peer. */
  relay(payload: unknown): void {
    this.send({ type: "relay", payload });
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
