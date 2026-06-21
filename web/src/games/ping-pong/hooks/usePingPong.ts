import { useEffect, useRef, useState } from "react";
import { PingPongGame } from "../domain/PingPongGame";
import type { Phase, Score, Side } from "../domain/types";

/**
 * Bridges the table-tennis sim to React. The per-frame simulation runs in the
 * R3F scene (reading `game` directly); React state here only mirrors score,
 * phase and server, which change rarely.
 */
export function usePingPong() {
  const gameRef = useRef<PingPongGame | null>(null);
  if (!gameRef.current) gameRef.current = new PingPongGame();
  const game = gameRef.current;

  const [score, setScore] = useState<Score>({ player: 0, ai: 0 });
  const [phase, setPhase] = useState<Phase>("serving");
  const [server, setServer] = useState<Side>("player");
  const [difficulty, setDifficultyState] = useState(0.6);

  useEffect(() => {
    game.setEvents({ onScore: setScore, onPhase: setPhase, onServer: setServer });
  }, [game]);

  const setDifficulty = (value: number) => {
    setDifficultyState(value);
    game.difficulty = value;
  };

  const restart = () => {
    game.reset();
    setPhase("serving");
  };

  return { game, score, phase, server, difficulty, setDifficulty, restart };
}
