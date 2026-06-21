import { useEffect, useRef, useState } from "react";
import { PoolGame } from "../domain/PoolGame";
import type { PoolPhase } from "../domain/types";

export function usePool() {
  const gameRef = useRef<PoolGame | null>(null);
  if (!gameRef.current) gameRef.current = new PoolGame();
  const game = gameRef.current;

  const [pocketed, setPocketed] = useState(0);
  const [phase, setPhase] = useState<PoolPhase>("aiming");

  useEffect(() => {
    game.setEvents({ onScore: setPocketed, onPhase: setPhase });
  }, [game]);

  const restart = () => {
    game.reset();
    setPhase("aiming");
  };

  return { game, pocketed, phase, restart };
}
