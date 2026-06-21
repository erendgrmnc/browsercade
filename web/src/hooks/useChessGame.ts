/**
 * Bridges the framework-agnostic GameController + Opponent to React. Owns the
 * UI-level state (selection, board flip, "thinking") and the turn flow; the
 * rules live in GameController and the AI behind the Opponent interface.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GameController } from "@/domain/chess/GameController";
import { LocalAIOpponent } from "@/domain/opponent/LocalAIOpponent";
import type { Opponent } from "@/domain/opponent/Opponent";
import type { BoardCell, GameStatus, PieceColor, Square } from "@/domain/chess/types";

export type ChessGameState = {
  board: BoardCell[][];
  status: GameStatus;
  history: string[];
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  playerColor: PieceColor;
  level: number;
  thinking: boolean;
  flipped: boolean;
  isGameOver: boolean;
  onSquare: (square: Square) => void;
  newGame: (color: PieceColor) => void;
  setLevel: (level: number) => void;
  undo: () => void;
  toggleFlip: () => void;
};

export function useChessGame(initialLevel = 3): ChessGameState {
  const controllerRef = useRef(new GameController());
  const opponentRef = useRef<Opponent | null>(null);
  const playerColorRef = useRef<PieceColor>("w");

  const [, forceRender] = useState(0);
  const refresh = useCallback(() => forceRender((n) => n + 1), []);

  const [selected, setSelected] = useState<Square | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor>("w");
  const [level, setLevelState] = useState(initialLevel);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Create the opponent once for the component's lifetime.
  useEffect(() => {
    const opponent = new LocalAIOpponent(initialLevel);
    opponentRef.current = opponent;
    return () => opponent.dispose();
  }, [initialLevel]);

  const askOpponent = useCallback(async () => {
    const game = controllerRef.current;
    const opponent = opponentRef.current;
    if (!opponent || game.isGameOver || game.turn === playerColorRef.current) return;
    setThinking(true);
    const move = await opponent.requestMove(game.fen);
    if (game.tryMove(move)) setLastMove({ from: move.from, to: move.to });
    setThinking(false);
    refresh();
  }, [refresh]);

  const onSquare = (square: Square) => {
    const game = controllerRef.current;
    if (thinking || game.isGameOver || game.turn !== playerColorRef.current) return;

    if (selected && game.legalTargets(selected).includes(square)) {
      game.tryMove({ from: selected, to: square });
      setSelected(null);
      setLastMove({ from: selected, to: square });
      refresh();
      if (!game.isGameOver) void askOpponent();
      return;
    }

    const piece = game.pieceAt(square);
    setSelected(piece && piece.color === playerColorRef.current ? square : null);
  };

  const newGame = (color: PieceColor) => {
    playerColorRef.current = color;
    controllerRef.current.reset();
    setPlayerColor(color);
    setFlipped(color === "b");
    setSelected(null);
    setLastMove(null);
    setThinking(false);
    refresh();
    if (color === "b") void askOpponent(); // AI plays White and moves first
  };

  const setLevel = (next: number) => {
    setLevelState(next);
    opponentRef.current?.setLevel(next);
  };

  const undo = () => {
    if (thinking) return;
    const game = controllerRef.current;
    game.undo(); // the last move…
    if (game.turn !== playerColorRef.current) game.undo(); // …and its pair, back to the player
    setSelected(null);
    setLastMove(null);
    refresh();
    if (!game.isGameOver && game.turn !== playerColorRef.current) void askOpponent();
  };

  const game = controllerRef.current;
  return {
    board: game.board(),
    status: game.status(),
    history: game.history(),
    selected,
    legalTargets: selected ? game.legalTargets(selected) : [],
    lastMove,
    playerColor,
    level,
    thinking,
    flipped,
    isGameOver: game.isGameOver,
    onSquare,
    newGame,
    setLevel,
    undo,
    toggleFlip: () => setFlipped((v) => !v),
  };
}
