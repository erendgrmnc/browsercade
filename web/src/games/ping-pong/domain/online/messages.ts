/** Relay payloads for online table tennis (the server forwards these opaquely). */
import type { Phase, Side } from "../types";

export type PingPongMessage =
  /** Host → guest: an authoritative snapshot each frame (host runs the sim). */
  | {
      kind: "state";
      bx: number; // ball position
      by: number;
      bz: number;
      px: number; // host (near) paddle X
      pz: number; // host paddle depth
      roll: number; // host paddle roll
      ax: number; // guest (far) paddle X
      sp: number; // score: host (player)
      sa: number; // score: guest (ai)
      ph: Phase;
      sv: Side; // current server ("player" = host, "ai" = guest)
    }
  /** Guest → host: the guest's far-paddle X (already in world coordinates). */
  | { kind: "input"; x: number }
  /** Guest → host: the guest requests their serve. */
  | { kind: "serve" };
