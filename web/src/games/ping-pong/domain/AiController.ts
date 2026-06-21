import { lerp } from "@/shared/math";

/**
 * Decides where the AI paddle wants to be. It commits to the ball more strongly
 * at higher difficulty; misses emerge naturally from the paddle's capped speed
 * (set by the game), not from random jitter — so behaviour stays deterministic.
 */
export class AiController {
  targetX(ballX: number, ballVZ: number, currentX: number, difficulty: number): number {
    // Ball moving away → drift back toward the centre.
    if (ballVZ >= 0) return currentX * 0.85;

    const commit = lerp(0.5, 1, difficulty);
    return ballX * commit + currentX * (1 - commit);
  }
}
