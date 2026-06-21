/**
 * Reusable lobby + relay hook shared by every physics game's online mode. It
 * owns the connection lifecycle (free-tier wake-up → connect → create/join),
 * seat assignment, room code, and forwards opaque payloads to/from the peer.
 *
 * Game logic stays in the caller: pass `onPayload` to react to the opponent's
 * messages and call `sendPayload` to send yours. The server is a thin relay, so
 * both clients simulate locally (deterministic turn games) or one client hosts
 * the simulation and broadcasts (real-time games).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { RelayClient, type RelayServerMessage, type Seat } from "./RelayClient";
import { SERVER_URL } from "./serverUrl";
import { healthUrl, wakeServer } from "./wake";

export type RelayPhase = "idle" | "connecting" | "waiting" | "playing" | "ended";

export type UseRelayRoomOptions<P> = {
  /** Game type tag sent to the server (e.g. "pool"); rooms are scoped by it. */
  game: string;
  /** The opponent sent us a payload. */
  onPayload?: (payload: P) => void;
  /** Both seats are now filled — the match can begin. Receives our seat. */
  onStart?: (seat: Seat) => void;
  /** The opponent disconnected. */
  onOpponentLeft?: () => void;
};

export type RelayRoomState<P> = {
  phase: RelayPhase;
  seat: Seat | null;
  roomCode: string | null;
  notice: string | null;
  createGame: () => void;
  joinGame: (code: string) => void;
  sendPayload: (payload: P) => void;
  setNotice: (notice: string | null) => void;
  leave: () => void;
};

export function useRelayRoom<P>(opts: UseRelayRoomOptions<P>): RelayRoomState<P> {
  const { game, onPayload, onStart, onOpponentLeft } = opts;

  const clientRef = useRef<RelayClient | null>(null);
  const seatRef = useRef<Seat | null>(null);
  const cancelledRef = useRef(false);

  // Keep the latest callbacks in refs so the message handler is stable.
  const cbRef = useRef({ onPayload, onStart, onOpponentLeft });
  cbRef.current = { onPayload, onStart, onOpponentLeft };

  const [phase, setPhase] = useState<RelayPhase>("idle");
  const [seat, setSeat] = useState<Seat | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleMessage = useCallback((m: RelayServerMessage) => {
    switch (m.type) {
      case "joined":
        seatRef.current = m.seat ?? null;
        setSeat(m.seat ?? null);
        setRoomCode(m.room ?? null);
        if (m.seat === "guest") {
          // Joining fills the room → start immediately.
          setPhase("playing");
          setNotice(null);
          cbRef.current.onStart?.("guest");
        } else {
          setPhase("waiting");
          setNotice("Share the room code to start.");
        }
        break;
      case "opponentJoined":
        setPhase("playing");
        setNotice(null);
        cbRef.current.onStart?.("host");
        break;
      case "relay":
        cbRef.current.onPayload?.(m.payload as P);
        break;
      case "opponentLeft":
        setPhase("ended");
        setNotice("Opponent left the game.");
        cbRef.current.onOpponentLeft?.();
        break;
      case "error":
        setNotice(m.message ?? "Something went wrong.");
        break;
    }
  }, []);

  const connectThen = useCallback(
    (action: (c: RelayClient) => void) => {
      cancelledRef.current = false;
      setPhase("connecting");
      setNotice("Waking the server… the free tier can take ~30s on the first connection.");

      void wakeServer(healthUrl(SERVER_URL)).then((reachable) => {
        if (cancelledRef.current) return;
        if (!reachable) {
          setNotice("Couldn't reach the server. Please try again in a moment.");
          setPhase("idle");
          return;
        }
        setNotice(null);
        const client = new RelayClient(SERVER_URL);
        clientRef.current = client;
        let opened = false;
        client.connect({
          onMessage: handleMessage,
          onOpen: () => {
            opened = true;
            setNotice(null);
            action(client);
          },
          onError: () => {},
          onClose: () => {
            if (opened || cancelledRef.current) return;
            setNotice(
              "The server refused the connection. If you're running locally, add this page's origin to the server's ALLOWED_ORIGINS.",
            );
            setPhase("idle");
          },
        });
      });
    },
    [handleMessage],
  );

  const createGame = useCallback(
    () => connectThen((c) => c.create(game)),
    [connectThen, game],
  );

  const joinGame = useCallback(
    (code: string) => {
      const room = code.trim().toUpperCase();
      if (room) connectThen((c) => c.join(game, room));
    },
    [connectThen, game],
  );

  const sendPayload = useCallback((payload: P) => {
    clientRef.current?.relay(payload);
  }, []);

  const leave = useCallback(() => {
    cancelledRef.current = true;
    clientRef.current?.close();
    clientRef.current = null;
    seatRef.current = null;
    setPhase("idle");
    setSeat(null);
    setRoomCode(null);
    setNotice(null);
  }, []);

  // Close the socket if the component unmounts (e.g. switching game modes).
  useEffect(() => () => clientRef.current?.close(), []);

  return {
    phase,
    seat,
    roomCode,
    notice,
    createGame,
    joinGame,
    sendPayload,
    setNotice,
    leave,
  };
}
