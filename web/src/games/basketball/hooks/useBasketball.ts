import { useEffect, useRef, useState } from "react";
import { BasketballGame, type BasketballPhase, type BasketballStats } from "../domain/BasketballGame";
import { RULES } from "../config";

export function useBasketball() {
  const gameRef = useRef<BasketballGame | null>(null);
  if (!gameRef.current) gameRef.current = new BasketballGame();
  const game = gameRef.current;

  const [stats, setStats] = useState<BasketballStats>({ made: 0, attempts: 0 });
  const [clock, setClock] = useState<number>(RULES.clockSeconds);
  const [phase, setPhase] = useState<BasketballPhase>("aiming");

  useEffect(() => {
    game.setEvents({ onStats: setStats, onClock: setClock, onPhase: setPhase });
  }, [game]);

  const restart = () => {
    game.reset();
    setPhase("aiming");
  };

  return { game, stats, clock, phase, restart };
}
