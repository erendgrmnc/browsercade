import { useEffect, useRef, useState } from "react";
import {
  BeerPongGame,
  type BeerPongPhase,
  type BeerPongStats,
  type Cup,
} from "../domain/BeerPongGame";

export function useBeerPong() {
  const gameRef = useRef<BeerPongGame | null>(null);
  if (!gameRef.current) gameRef.current = new BeerPongGame();
  const game = gameRef.current;

  const [stats, setStats] = useState<BeerPongStats>({ hits: 0, throws: 0, cupsLeft: 10 });
  const [cups, setCups] = useState<Cup[]>([]);
  const [phase, setPhase] = useState<BeerPongPhase>("aiming");

  useEffect(() => {
    game.setEvents({
      onStats: setStats,
      onCups: (next) => setCups(next.map((cup) => ({ ...cup }))),
      onPhase: setPhase,
    });
  }, [game]);

  const restart = () => {
    game.reset();
    setPhase("aiming");
  };

  return { game, stats, cups, phase, restart };
}
