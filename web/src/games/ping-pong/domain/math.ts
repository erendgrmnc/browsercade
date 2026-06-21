/** Small numeric helpers shared by the ping-pong simulation. */
export const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Move `current` toward `target` by at most `maxDelta` (frame-rate-independent easing). */
export function approach(current: number, target: number, maxDelta: number): number {
  const delta = target - current;
  return Math.abs(delta) <= maxDelta ? target : current + Math.sign(delta) * maxDelta;
}
