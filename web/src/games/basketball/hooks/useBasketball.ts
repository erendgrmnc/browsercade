import { useEffect, useRef, useState } from "react";
import {
  BasketballGame,
  type AimStage,
  type BasketballPhase,
  type BasketballStats,
} from "../domain/BasketballGame";
import { RULES } from "../config";

export function useBasketball() {
  const gameRef = useRef<BasketballGame | null>(null);
  if (!gameRef.current) gameRef.current = new BasketballGame();
  const game = gameRef.current;

  const [stats, setStats] = useState<BasketballStats>({ made: 0, attempts: 0 });
  const [clock, setClock] = useState<number>(RULES.clockSeconds);
  const [phase, setPhase] = useState<BasketballPhase>("aiming");
  const [stage, setStage] = useState<AimStage>("pitch");

  useEffect(() => {
    game.setEvents({ onStats: setStats, onClock: setClock, onPhase: setPhase, onStage: setStage });
  }, [game]);

  const restart = () => {
    game.reset();
    setPhase("aiming");
  };

  return { game, stats, clock, phase, stage, restart };
}
