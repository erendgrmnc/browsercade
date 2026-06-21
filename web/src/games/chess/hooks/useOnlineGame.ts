/**
 * Online multiplayer game state. Unlike useChessGame (local AI), the server is
 * authoritative: the client sends move intents and renders whatever board state
 * the server broadcasts back. A GameController rebuilt from the server's FEN is
 * used purely to render and to compute legal targets for the local player.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameController } from "@/games/chess/domain/chess/GameController";
import { RealtimeClient } from "@/games/chess/domain/online/RealtimeClient";
import type { ServerMessage } from "@/games/chess/domain/online/messages";
import type { BoardCell, PieceColor, Square } from "@/games/chess/domain/chess/types";
import { SERVER_URL } from "@/shared/net/serverUrl";

export type OnlinePhase = "idle" | "connecting" | "waiting" | "playing" | "ended";

export type OnlineGameState = {
  phase: OnlinePhase;
  roomCode: string | null;
  myColor: PieceColor | null;
  board: BoardCell[][];
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  notice: string | null;
  isMyTurn: boolean;
  createGame: () => void;
  joinGame: (code: string) => void;
  onSquare: (square: Square) => void;
  resign: () => void;
  leave: () => void;
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function useOnlineGame(): OnlineGameState {
  const clientRef = useRef<RealtimeClient | null>(null);
  const myColorRef = useRef<PieceColor | null>(null);
  const cancelledRef = useRef(false);

  const [phase, setPhase] = useState<OnlinePhase>("idle");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const [fen, setFen] = useState<string>(START_FEN);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);

  // A fresh controller per position; only used for rendering + legal targets.
  const controller = useMemo(() => new GameController(fen), [fen]);

  const handleMessage = useCallback((m: ServerMessage) => {
    switch (m.type) {
      case "joined":
        myColorRef.current = m.color ?? null;
        setMyColor(m.color ?? null);
        setRoomCode(m.room ?? null);
        setPhase(m.color === "b" ? "playing" : "waiting");
        setNotice(m.color === "w" ? "Share the room code to start." : null);
        break;
      case "opponentJoined":
        setPhase("playing");
        setNotice(null);
        break;
      case "state":
        if (m.fen) setFen(m.fen);
        if (m.turn) setTurn(m.turn);
        setLastMove(m.lastMove ?? null);
        setSelected(null);
        break;
      case "opponentLeft":
        setPhase("ended");
        setNotice("Opponent left the game.");
        break;
      case "gameOver":
        setPhase("ended");
        setNotice(resultText(m.result, m.status, myColorRef.current));
        break;
      case "error":
        setNotice(m.message ?? "Something went wrong.");
        break;
    }
  }, []);

  const connectThen = useCallback(
    (action: (c: RealtimeClient) => void) => {
      cancelledRef.current = false;
      setPhase("connecting");
      setNotice("Waking the server… the free tier can take ~30s on the first connection.");

      // Probe /health first: this wakes a sleeping free-tier server and confirms
      // reachability, so we only open the socket once the server can answer.
      void wakeServer(healthUrl(SERVER_URL)).then((reachable) => {
        if (cancelledRef.current) return;
        if (!reachable) {
          setNotice("Couldn't reach the server. Please try again in a moment.");
          setPhase("idle");
          return;
        }
        setNotice(null);
        const client = new RealtimeClient(SERVER_URL);
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
            // Health passed but the socket was refused → almost always an origin block.
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

  const createGame = useCallback(() => connectThen((c) => c.create()), [connectThen]);

  const joinGame = useCallback(
    (code: string) => {
      const room = code.trim().toUpperCase();
      if (room) connectThen((c) => c.join(room));
    },
    [connectThen],
  );

  const onSquare = (square: Square) => {
    const me = myColorRef.current;
    if (phase !== "playing" || !me || controller.isGameOver || controller.turn !== me) return;

    if (selected && controller.legalTargets(selected).includes(square)) {
      const promotion = isPromotion(controller, selected, square, me) ? "q" : undefined;
      clientRef.current?.move(selected, square, promotion);
      setSelected(null); // optimistic clear; authoritative state arrives next
      return;
    }

    const piece = controller.pieceAt(square);
    setSelected(piece && piece.color === me ? square : null);
  };

  const resign = () => clientRef.current?.resign();

  const leave = useCallback(() => {
    cancelledRef.current = true;
    clientRef.current?.close();
    clientRef.current = null;
    myColorRef.current = null;
    setPhase("idle");
    setRoomCode(null);
    setMyColor(null);
    setFen(START_FEN);
    setTurn("w");
    setLastMove(null);
    setSelected(null);
    setNotice(null);
  }, []);

  // Close the socket if the component unmounts (e.g. switching game modes).
  useEffect(() => () => clientRef.current?.close(), []);

  return {
    phase,
    roomCode,
    myColor,
    board: controller.board(),
    selected,
    legalTargets: selected ? controller.legalTargets(selected) : [],
    lastMove,
    notice,
    isMyTurn: phase === "playing" && myColor !== null && turn === myColor,
    createGame,
    joinGame,
    onSquare,
    resign,
    leave,
  };
}

function isPromotion(controller: GameController, from: Square, to: Square, me: PieceColor): boolean {
  const piece = controller.pieceAt(from);
  if (!piece || piece.type !== "p") return false;
  const rank = to[1];
  return (me === "w" && rank === "8") || (me === "b" && rank === "1");
}

function resultText(result: string | undefined, status: string | undefined, me: PieceColor | null): string {
  let winner: PieceColor | null = null;
  if (result === "1-0") winner = "w";
  else if (result === "0-1") winner = "b";

  if (!winner) return "Draw.";

  const how = status === "resigned" ? " by resignation" : status === "checkmate" ? " by checkmate" : "";
  if (me !== null) return `${me === winner ? "You win" : "You lose"}${how}.`;
  return `${winner === "w" ? "White" : "Black"} wins${how}.`;
}

/** Derive the HTTP health URL from the WebSocket URL (ws→http, /ws→/health). */
function healthUrl(wsUrl: string): string {
  return wsUrl.replace(/^ws/, "http").replace(/\/ws\/?$/, "/health");
}

/** Poll /health until it answers OK (waking a sleeping free-tier server), or time out. */
async function wakeServer(url: string, timeoutMs = 75_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return true;
    } catch {
      /* still asleep or unreachable — retry */
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}
