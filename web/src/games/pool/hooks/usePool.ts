import { useEffect, useRef, useState } from "react";
import { PoolGame } from "../domain/PoolGame";
import { AI } from "../config";
import type { PoolPhase, RulesState } from "../domain/types";

const INITIAL_RULES: RulesState = {
  currentPlayer: 0,
  groups: [null, null],
  ballInHand: false,
  winner: null,
  message: "Break the rack.",
};

/** Solo 8-ball vs. a heuristic AI. */
export function usePool() {
  const gameRef = useRef<PoolGame | null>(null);
  if (!gameRef.current) gameRef.current = new PoolGame({ rules: true, vsAI: true });
  const game = gameRef.current;

  const [pocketed, setPocketed] = useState(0);
  const [phase, setPhase] = useState<PoolPhase>("aiming");
  const [rules, setRules] = useState<RulesState>(INITIAL_RULES);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    game.setEvents({ onScore: setPocketed, onPhase: setPhase, onRules: setRules });
  }, [game]);

  // Let the AI take its turn when it's up.
  useEffect(() => {
    if (aiTimer.current) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
    if (phase !== "aiming" || rules.currentPlayer !== 1 || rules.winner !== null) return;

    aiTimer.current = setTimeout(() => {
      if (game.phase !== "aiming" || game.currentPlayer !== 1 || game.winner !== null) return;
      const shot = game.computeAIShot();
      if (shot.place) game.placeCue(shot.place.x, shot.place.z);
      game.setAim(shot.aimX, shot.aimZ);
      game.strike(shot.power);
    }, AI.thinkMs);

    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [game, phase, rules.currentPlayer, rules.winner]);

  const restart = () => {
    game.reset();
    setPhase("aiming");
  };

  // The human only aims on their turn, while no shot is in flight.
  const aimable = phase === "aiming" && rules.currentPlayer === 0 && rules.winner === null;

  return { game, pocketed, phase, rules, restart, aimable };
}
