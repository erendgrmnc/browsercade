/**
 * WebSocket endpoint for the multiplayer server.
 * Override via VITE_SERVER_URL (e.g. ws://localhost:8080/ws for local dev).
 */
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? "wss://chess3d-server.onrender.com/ws";
